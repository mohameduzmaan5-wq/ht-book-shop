
-- Roles
CREATE TYPE public.app_role AS ENUM ('admin', 'customer');

CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  full_name TEXT,
  phone TEXT,
  address TEXT,
  district TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  role app_role NOT NULL,
  UNIQUE(user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

-- Publications
CREATE TABLE public.publications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.publications ENABLE ROW LEVEL SECURITY;

-- Books
CREATE TABLE public.books (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  author TEXT NOT NULL,
  publication_id UUID REFERENCES public.publications ON DELETE SET NULL,
  grade TEXT NOT NULL, -- 'Grade 1'..'Grade 11','O/L','A/L','Other'
  category TEXT,
  price NUMERIC(10,2) NOT NULL CHECK (price >= 0),
  stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
  weight_grams INTEGER NOT NULL DEFAULT 500 CHECK (weight_grams > 0),
  description TEXT,
  cover_url TEXT,
  is_featured BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.books ENABLE ROW LEVEL SECURITY;
CREATE INDEX ON public.books (grade);
CREATE INDEX ON public.books (publication_id);

-- Delivery rates per district
CREATE TABLE public.delivery_rates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  district TEXT NOT NULL UNIQUE,
  base_fee NUMERIC(10,2) NOT NULL DEFAULT 350,
  per_kg NUMERIC(10,2) NOT NULL DEFAULT 100
);
ALTER TABLE public.delivery_rates ENABLE ROW LEVEL SECURITY;

-- Orders
CREATE TYPE public.order_status AS ENUM ('pending','confirmed','shipped','delivered','cancelled');

CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users ON DELETE SET NULL,
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  address TEXT NOT NULL,
  district TEXT NOT NULL,
  subtotal NUMERIC(10,2) NOT NULL,
  delivery_fee NUMERIC(10,2) NOT NULL,
  total NUMERIC(10,2) NOT NULL,
  total_weight_grams INTEGER NOT NULL DEFAULT 0,
  status order_status NOT NULL DEFAULT 'pending',
  payment_method TEXT NOT NULL DEFAULT 'cod',
  courier TEXT,
  tracking_number TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
CREATE INDEX ON public.orders (user_id);
CREATE INDEX ON public.orders (status);

CREATE TABLE public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders ON DELETE CASCADE,
  book_id UUID REFERENCES public.books ON DELETE SET NULL,
  name TEXT NOT NULL,
  price NUMERIC(10,2) NOT NULL,
  qty INTEGER NOT NULL CHECK (qty > 0)
);
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
CREATE INDEX ON public.order_items (order_id);

-- Wishlist
CREATE TABLE public.wishlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  book_id UUID NOT NULL REFERENCES public.books ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, book_id)
);
ALTER TABLE public.wishlist ENABLE ROW LEVEL SECURITY;

-- Stock decrement trigger
CREATE OR REPLACE FUNCTION public.decrement_stock_on_order_item()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.book_id IS NOT NULL THEN
    UPDATE public.books SET stock = GREATEST(stock - NEW.qty, 0), updated_at = now()
    WHERE id = NEW.book_id;
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER trg_order_item_stock
AFTER INSERT ON public.order_items
FOR EACH ROW EXECUTE FUNCTION public.decrement_stock_on_order_item();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name) VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name',''))
  ON CONFLICT (id) DO NOTHING;
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'customer')
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ===== RLS Policies =====
-- Profiles
CREATE POLICY "own profile read" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "own profile insert" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "own profile update" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "admin read profiles" ON public.profiles FOR SELECT USING (public.has_role(auth.uid(),'admin'));

-- user_roles
CREATE POLICY "self read roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "admin manage roles" ON public.user_roles FOR ALL USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- publications: public read, admin write
CREATE POLICY "anyone read pubs" ON public.publications FOR SELECT USING (true);
CREATE POLICY "admin write pubs" ON public.publications FOR ALL USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- books: public read, admin write
CREATE POLICY "anyone read books" ON public.books FOR SELECT USING (true);
CREATE POLICY "admin write books" ON public.books FOR ALL USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- delivery_rates: public read, admin write
CREATE POLICY "anyone read rates" ON public.delivery_rates FOR SELECT USING (true);
CREATE POLICY "admin write rates" ON public.delivery_rates FOR ALL USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- orders
CREATE POLICY "own orders read" ON public.orders FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "own orders insert" ON public.orders FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);
CREATE POLICY "admin read orders" ON public.orders FOR SELECT USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "admin update orders" ON public.orders FOR UPDATE USING (public.has_role(auth.uid(),'admin'));

-- order_items
CREATE POLICY "own order items read" ON public.order_items FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_id AND o.user_id = auth.uid())
);
CREATE POLICY "insert order items" ON public.order_items FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_id AND (o.user_id = auth.uid() OR o.user_id IS NULL))
);
CREATE POLICY "admin read items" ON public.order_items FOR SELECT USING (public.has_role(auth.uid(),'admin'));

-- wishlist
CREATE POLICY "own wishlist all" ON public.wishlist FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Realtime for orders + books (live stock)
ALTER PUBLICATION supabase_realtime ADD TABLE public.books;
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
