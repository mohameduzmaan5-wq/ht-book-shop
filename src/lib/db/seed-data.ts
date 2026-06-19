import type {
  User, Branch, Book, BranchInventory, Sale, SaleItem,
  StockTransfer, Notification, AuditLog, Expense,
} from '@/types';

// ---- Helpers ----
const id = (prefix: string, n: number) => `${prefix}_${String(n).padStart(4, '0')}`;
const date = (daysAgo: number) => {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString();
};

// ============================================
// BRANCHES
// ============================================
export const branches: Branch[] = [
  {
    id: 'branch_001', name: 'Downtown Flagship', address: '123 Main Street, City Center',
    phone: '+1-555-0101', email: 'downtown@bookshop.com', manager_id: 'user_002',
    is_active: true, created_at: date(365), updated_at: date(0),
  },
  {
    id: 'branch_002', name: 'University District', address: '456 College Ave, University Area',
    phone: '+1-555-0102', email: 'university@bookshop.com', manager_id: 'user_003',
    is_active: true, created_at: date(300), updated_at: date(0),
  },
  {
    id: 'branch_003', name: 'Westside Mall', address: '789 Shopping Blvd, Westside',
    phone: '+1-555-0103', email: 'westside@bookshop.com', manager_id: 'user_004',
    is_active: true, created_at: date(200), updated_at: date(0),
  },
];

// ============================================
// USERS
// ============================================
export const users: User[] = [
  {
    id: 'user_001', email: 'admin@bookshop.com', name: 'Alexander Wright',
    role: 'super_admin', branch_id: null, is_active: true,
    avatar: '', created_at: date(365), updated_at: date(0),
  },
  {
    id: 'user_002', email: 'sarah@bookshop.com', name: 'Sarah Mitchell',
    role: 'branch_manager', branch_id: 'branch_001', is_active: true,
    avatar: '', created_at: date(350), updated_at: date(0),
  },
  {
    id: 'user_003', email: 'james@bookshop.com', name: 'James Rodriguez',
    role: 'branch_manager', branch_id: 'branch_002', is_active: true,
    avatar: '', created_at: date(300), updated_at: date(0),
  },
  {
    id: 'user_004', email: 'emma@bookshop.com', name: 'Emma Chen',
    role: 'branch_manager', branch_id: 'branch_003', is_active: true,
    avatar: '', created_at: date(200), updated_at: date(0),
  },
  {
    id: 'user_005', email: 'mike@bookshop.com', name: 'Michael Johnson',
    role: 'cashier', branch_id: 'branch_001', is_active: true,
    avatar: '', created_at: date(180), updated_at: date(0),
  },
  {
    id: 'user_006', email: 'lisa@bookshop.com', name: 'Lisa Park',
    role: 'cashier', branch_id: 'branch_001', is_active: true,
    avatar: '', created_at: date(150), updated_at: date(0),
  },
  {
    id: 'user_007', email: 'david@bookshop.com', name: 'David Kim',
    role: 'cashier', branch_id: 'branch_002', is_active: true,
    avatar: '', created_at: date(170), updated_at: date(0),
  },
  {
    id: 'user_008', email: 'anna@bookshop.com', name: 'Anna Williams',
    role: 'cashier', branch_id: 'branch_002', is_active: true,
    avatar: '', created_at: date(120), updated_at: date(0),
  },
  {
    id: 'user_009', email: 'robert@bookshop.com', name: 'Robert Taylor',
    role: 'cashier', branch_id: 'branch_003', is_active: true,
    avatar: '', created_at: date(90), updated_at: date(0),
  },
  {
    id: 'user_010', email: 'maria@bookshop.com', name: 'Maria Garcia',
    role: 'cashier', branch_id: 'branch_003', is_active: true,
    avatar: '', created_at: date(60), updated_at: date(0),
  },
];

// ============================================
// BOOKS (100 Realistic Books)
// ============================================
export const books: Book[] = [
  { id: id('book',1), isbn: '978-0-06-112008-4', barcode: '9780061120084', title: 'To Kill a Mockingbird', author: 'Harper Lee', publisher: 'HarperCollins', category: 'Fiction', description: 'A classic of modern American literature.', cost_price: 8.99, selling_price: 15.99, image_url: '', created_at: date(300), updated_at: date(0) },
  { id: id('book',2), isbn: '978-0-452-28423-4', barcode: '9780452284234', title: '1984', author: 'George Orwell', publisher: 'Signet Classic', category: 'Fiction', description: 'A dystopian novel set in a totalitarian society.', cost_price: 7.50, selling_price: 13.99, image_url: '', created_at: date(300), updated_at: date(0) },
  { id: id('book',3), isbn: '978-0-7432-7356-5', barcode: '9780743273565', title: 'The Great Gatsby', author: 'F. Scott Fitzgerald', publisher: 'Scribner', category: 'Fiction', description: 'A novel of the Jazz Age.', cost_price: 6.99, selling_price: 12.99, image_url: '', created_at: date(300), updated_at: date(0) },
  { id: id('book',4), isbn: '978-0-316-76948-0', barcode: '9780316769488', title: 'The Catcher in the Rye', author: 'J.D. Salinger', publisher: 'Little, Brown', category: 'Fiction', description: 'A story of teenage angst and alienation.', cost_price: 7.99, selling_price: 14.99, image_url: '', created_at: date(300), updated_at: date(0) },
  { id: id('book',5), isbn: '978-0-14-028329-7', barcode: '9780140283297', title: 'The Odyssey', author: 'Homer', publisher: 'Penguin Classics', category: 'Fiction', description: 'An ancient Greek epic poem.', cost_price: 9.50, selling_price: 16.99, image_url: '', created_at: date(300), updated_at: date(0) },
  { id: id('book',6), isbn: '978-0-06-093546-7', barcode: '9780060935467', title: 'To Kill a Kingdom', author: 'Alexandra Christo', publisher: 'Feiwel & Friends', category: 'Fiction', description: 'A dark fantasy romance.', cost_price: 10.99, selling_price: 18.99, image_url: '', created_at: date(280), updated_at: date(0) },
  { id: id('book',7), isbn: '978-0-14-044913-6', barcode: '9780140449136', title: 'Crime and Punishment', author: 'Fyodor Dostoevsky', publisher: 'Penguin Classics', category: 'Fiction', description: 'A psychological novel by the Russian author.', cost_price: 8.50, selling_price: 15.99, image_url: '', created_at: date(300), updated_at: date(0) },
  { id: id('book',8), isbn: '978-0-06-112008-5', barcode: '9780061120085', title: 'Brave New World', author: 'Aldous Huxley', publisher: 'Harper Perennial', category: 'Fiction', description: 'A dystopian novel about a future society.', cost_price: 7.99, selling_price: 14.50, image_url: '', created_at: date(300), updated_at: date(0) },
  { id: id('book',9), isbn: '978-0-06-112008-6', barcode: '9780061120086', title: 'The Alchemist', author: 'Paulo Coelho', publisher: 'HarperOne', category: 'Fiction', description: 'A philosophical novel about following dreams.', cost_price: 8.99, selling_price: 16.50, image_url: '', created_at: date(290), updated_at: date(0) },
  { id: id('book',10), isbn: '978-0-06-112008-7', barcode: '9780061120087', title: 'One Hundred Years of Solitude', author: 'Gabriel García Márquez', publisher: 'Harper Perennial', category: 'Fiction', description: 'A landmark of magical realism.', cost_price: 9.99, selling_price: 17.99, image_url: '', created_at: date(300), updated_at: date(0) },
  { id: id('book',11), isbn: '978-1-59420-009-2', barcode: '9781594200090', title: 'The Kite Runner', author: 'Khaled Hosseini', publisher: 'Riverhead Books', category: 'Fiction', description: 'A story of friendship and redemption.', cost_price: 9.50, selling_price: 16.99, image_url: '', created_at: date(280), updated_at: date(0) },
  { id: id('book',12), isbn: '978-0-06-112008-8', barcode: '9780061120088', title: 'The Book Thief', author: 'Markus Zusak', publisher: 'Knopf', category: 'Fiction', description: 'A story narrated by Death set in WWII.', cost_price: 9.99, selling_price: 17.50, image_url: '', created_at: date(270), updated_at: date(0) },
  { id: id('book',13), isbn: '978-0-374-52973-6', barcode: '9780374529734', title: 'Thinking, Fast and Slow', author: 'Daniel Kahneman', publisher: 'FSG', category: 'Non-Fiction', description: 'A groundbreaking tour of the mind.', cost_price: 11.99, selling_price: 19.99, image_url: '', created_at: date(300), updated_at: date(0) },
  { id: id('book',14), isbn: '978-0-06-231609-7', barcode: '9780062316097', title: 'Sapiens', author: 'Yuval Noah Harari', publisher: 'Harper', category: 'Non-Fiction', description: 'A brief history of humankind.', cost_price: 12.99, selling_price: 22.99, image_url: '', created_at: date(290), updated_at: date(0) },
  { id: id('book',15), isbn: '978-0-06-231610-3', barcode: '9780062316103', title: 'Homo Deus', author: 'Yuval Noah Harari', publisher: 'Harper', category: 'Non-Fiction', description: 'A brief history of tomorrow.', cost_price: 13.50, selling_price: 23.99, image_url: '', created_at: date(250), updated_at: date(0) },
  { id: id('book',16), isbn: '978-0-14-028329-8', barcode: '9780140283298', title: 'Educated', author: 'Tara Westover', publisher: 'Random House', category: 'Biography', description: 'A memoir about growing up in a survivalist family.', cost_price: 10.99, selling_price: 18.99, image_url: '', created_at: date(240), updated_at: date(0) },
  { id: id('book',17), isbn: '978-0-14-028329-9', barcode: '9780140283299', title: 'Becoming', author: 'Michelle Obama', publisher: 'Crown', category: 'Biography', description: 'A memoir by the former First Lady.', cost_price: 14.99, selling_price: 26.99, image_url: '', created_at: date(200), updated_at: date(0) },
  { id: id('book',18), isbn: '978-0-593-13529-0', barcode: '9780593135290', title: 'Atomic Habits', author: 'James Clear', publisher: 'Avery', category: 'Self-Help', description: 'Tiny changes, remarkable results.', cost_price: 11.99, selling_price: 21.99, image_url: '', created_at: date(220), updated_at: date(0) },
  { id: id('book',19), isbn: '978-0-06-112008-9', barcode: '9780061120089', title: 'The 7 Habits of Highly Effective People', author: 'Stephen Covey', publisher: 'Simon & Schuster', category: 'Self-Help', description: 'Powerful lessons in personal change.', cost_price: 10.50, selling_price: 18.99, image_url: '', created_at: date(300), updated_at: date(0) },
  { id: id('book',20), isbn: '978-0-06-112009-0', barcode: '9780061120090', title: 'Deep Work', author: 'Cal Newport', publisher: 'Grand Central', category: 'Self-Help', description: 'Rules for focused success in a distracted world.', cost_price: 10.99, selling_price: 19.50, image_url: '', created_at: date(250), updated_at: date(0) },
  { id: id('book',21), isbn: '978-0-06-112009-1', barcode: '9780061120091', title: 'The Lean Startup', author: 'Eric Ries', publisher: 'Currency', category: 'Business', description: 'How to build a successful startup.', cost_price: 12.99, selling_price: 22.99, image_url: '', created_at: date(300), updated_at: date(0) },
  { id: id('book',22), isbn: '978-0-06-112009-2', barcode: '9780061120092', title: 'Zero to One', author: 'Peter Thiel', publisher: 'Currency', category: 'Business', description: 'Notes on startups and how to build the future.', cost_price: 11.99, selling_price: 21.99, image_url: '', created_at: date(280), updated_at: date(0) },
  { id: id('book',23), isbn: '978-0-06-112009-3', barcode: '9780061120093', title: 'Good to Great', author: 'Jim Collins', publisher: 'HarperBusiness', category: 'Business', description: 'Why some companies make the leap.', cost_price: 13.50, selling_price: 24.99, image_url: '', created_at: date(300), updated_at: date(0) },
  { id: id('book',24), isbn: '978-0-06-112009-4', barcode: '9780061120094', title: 'The Innovators Dilemma', author: 'Clayton Christensen', publisher: 'Harper Business', category: 'Business', description: 'The revolutionary book about disruptive innovation.', cost_price: 12.50, selling_price: 22.50, image_url: '', created_at: date(300), updated_at: date(0) },
  { id: id('book',25), isbn: '978-0-06-112009-5', barcode: '9780061120095', title: 'A Brief History of Time', author: 'Stephen Hawking', publisher: 'Bantam', category: 'Science', description: 'From the Big Bang to Black Holes.', cost_price: 10.99, selling_price: 18.99, image_url: '', created_at: date(300), updated_at: date(0) },
  { id: id('book',26), isbn: '978-0-06-112009-6', barcode: '9780061120096', title: 'The Selfish Gene', author: 'Richard Dawkins', publisher: 'OUP Oxford', category: 'Science', description: 'A gene-centered view of evolution.', cost_price: 9.99, selling_price: 17.99, image_url: '', created_at: date(300), updated_at: date(0) },
  { id: id('book',27), isbn: '978-0-06-112009-7', barcode: '9780061120097', title: 'Cosmos', author: 'Carl Sagan', publisher: 'Ballantine Books', category: 'Science', description: 'A personal voyage through space and time.', cost_price: 11.50, selling_price: 19.99, image_url: '', created_at: date(300), updated_at: date(0) },
  { id: id('book',28), isbn: '978-0-06-112009-8', barcode: '9780061120098', title: 'The Structure of Scientific Revolutions', author: 'Thomas Kuhn', publisher: 'University of Chicago Press', category: 'Science', description: 'A landmark in the philosophy of science.', cost_price: 8.99, selling_price: 15.99, image_url: '', created_at: date(300), updated_at: date(0) },
  { id: id('book',29), isbn: '978-0-13-468599-1', barcode: '9780134685991', title: 'Clean Code', author: 'Robert C. Martin', publisher: 'Prentice Hall', category: 'Technology', description: 'A handbook of agile software craftsmanship.', cost_price: 25.99, selling_price: 44.99, image_url: '', created_at: date(300), updated_at: date(0) },
  { id: id('book',30), isbn: '978-0-59-651798-0', barcode: '9780596517984', title: 'JavaScript: The Good Parts', author: 'Douglas Crockford', publisher: "O'Reilly", category: 'Technology', description: 'Unearthing the excellence in JavaScript.', cost_price: 18.99, selling_price: 34.99, image_url: '', created_at: date(300), updated_at: date(0) },
  { id: id('book',31), isbn: '978-0-20-161622-4', barcode: '9780201616224', title: 'The Pragmatic Programmer', author: 'Andrew Hunt', publisher: 'Addison-Wesley', category: 'Technology', description: 'Your journey to mastery.', cost_price: 27.99, selling_price: 49.99, image_url: '', created_at: date(300), updated_at: date(0) },
  { id: id('book',32), isbn: '978-0-59-651700-3', barcode: '9780596517003', title: 'Design Patterns', author: 'Erich Gamma', publisher: 'Addison-Wesley', category: 'Technology', description: 'Elements of reusable object-oriented software.', cost_price: 30.99, selling_price: 54.99, image_url: '', created_at: date(300), updated_at: date(0) },
  { id: id('book',33), isbn: '978-0-59-651700-4', barcode: '9780596517004', title: 'Introduction to Algorithms', author: 'Thomas H. Cormen', publisher: 'MIT Press', category: 'Technology', description: 'The comprehensive textbook on algorithms.', cost_price: 50.00, selling_price: 89.99, image_url: '', created_at: date(300), updated_at: date(0) },
  { id: id('book',34), isbn: '978-0-59-651700-5', barcode: '9780596517005', title: 'Cracking the Coding Interview', author: 'Gayle Laakmann McDowell', publisher: 'CareerCup', category: 'Technology', description: '189 programming questions and solutions.', cost_price: 20.99, selling_price: 39.99, image_url: '', created_at: date(250), updated_at: date(0) },
  { id: id('book',35), isbn: '978-0-59-651700-6', barcode: '9780596517006', title: 'System Design Interview', author: 'Alex Xu', publisher: 'Byte by Byte', category: 'Technology', description: "An insider's guide to system design.", cost_price: 22.99, selling_price: 39.99, image_url: '', created_at: date(200), updated_at: date(0) },
  { id: id('book',36), isbn: '978-0-14-044913-7', barcode: '9780140449137', title: 'The Republic', author: 'Plato', publisher: 'Penguin Classics', category: 'Philosophy', description: 'Plato\'s most famous work on justice and the ideal state.', cost_price: 7.99, selling_price: 13.99, image_url: '', created_at: date(300), updated_at: date(0) },
  { id: id('book',37), isbn: '978-0-14-044913-8', barcode: '9780140449138', title: 'Meditations', author: 'Marcus Aurelius', publisher: 'Penguin Classics', category: 'Philosophy', description: 'Personal reflections of the Roman Emperor.', cost_price: 6.99, selling_price: 12.99, image_url: '', created_at: date(300), updated_at: date(0) },
  { id: id('book',38), isbn: '978-0-14-044913-9', barcode: '9780140449139', title: 'Beyond Good and Evil', author: 'Friedrich Nietzsche', publisher: 'Penguin Classics', category: 'Philosophy', description: 'A critique of past philosophers.', cost_price: 8.50, selling_price: 14.99, image_url: '', created_at: date(300), updated_at: date(0) },
  { id: id('book',39), isbn: '978-0-14-044914-0', barcode: '9780140449140', title: 'The Art of War', author: 'Sun Tzu', publisher: 'Penguin Classics', category: 'Philosophy', description: 'Ancient Chinese military treatise.', cost_price: 5.99, selling_price: 10.99, image_url: '', created_at: date(300), updated_at: date(0) },
  { id: id('book',40), isbn: '978-0-14-044914-1', barcode: '9780140449141', title: 'Thus Spoke Zarathustra', author: 'Friedrich Nietzsche', publisher: 'Penguin Classics', category: 'Philosophy', description: 'A philosophical novel by Nietzsche.', cost_price: 9.50, selling_price: 16.99, image_url: '', created_at: date(300), updated_at: date(0) },
  { id: id('book',41), isbn: '978-0-06-093546-8', barcode: '9780060935468', title: 'Guns, Germs, and Steel', author: 'Jared Diamond', publisher: 'W.W. Norton', category: 'History', description: 'The fates of human societies.', cost_price: 12.99, selling_price: 21.99, image_url: '', created_at: date(300), updated_at: date(0) },
  { id: id('book',42), isbn: '978-0-06-093546-9', barcode: '9780060935469', title: 'A Peoples History of the United States', author: 'Howard Zinn', publisher: 'Harper Perennial', category: 'History', description: 'History from the perspective of the people.', cost_price: 11.99, selling_price: 19.99, image_url: '', created_at: date(300), updated_at: date(0) },
  { id: id('book',43), isbn: '978-0-06-093547-0', barcode: '9780060935470', title: 'The Silk Roads', author: 'Peter Frankopan', publisher: 'Vintage', category: 'History', description: 'A new history of the world.', cost_price: 12.50, selling_price: 21.50, image_url: '', created_at: date(250), updated_at: date(0) },
  { id: id('book',44), isbn: '978-0-06-093547-1', barcode: '9780060935471', title: 'SPQR', author: 'Mary Beard', publisher: 'Profile Books', category: 'History', description: 'A history of ancient Rome.', cost_price: 11.99, selling_price: 20.99, image_url: '', created_at: date(280), updated_at: date(0) },
  { id: id('book',45), isbn: '978-0-06-093547-2', barcode: '9780060935472', title: 'The History of the Ancient World', author: 'Susan Wise Bauer', publisher: 'W.W. Norton', category: 'History', description: 'From the earliest accounts to the fall of Rome.', cost_price: 14.99, selling_price: 25.99, image_url: '', created_at: date(300), updated_at: date(0) },
  { id: id('book',46), isbn: '978-0-06-093547-3', barcode: '9780060935473', title: 'The Very Hungry Caterpillar', author: 'Eric Carle', publisher: 'World of Eric Carle', category: 'Children', description: 'A classic picture book for children.', cost_price: 4.99, selling_price: 9.99, image_url: '', created_at: date(300), updated_at: date(0) },
  { id: id('book',47), isbn: '978-0-06-093547-4', barcode: '9780060935474', title: 'Charlotte\'s Web', author: 'E.B. White', publisher: 'Harper & Row', category: 'Children', description: 'A timeless children\'s classic.', cost_price: 5.50, selling_price: 10.99, image_url: '', created_at: date(300), updated_at: date(0) },
  { id: id('book',48), isbn: '978-0-06-093547-5', barcode: '9780060935475', title: 'Harry Potter and the Philosophers Stone', author: 'J.K. Rowling', publisher: 'Bloomsbury', category: 'Children', description: 'The first book in the Harry Potter series.', cost_price: 8.99, selling_price: 16.99, image_url: '', created_at: date(300), updated_at: date(0) },
  { id: id('book',49), isbn: '978-0-06-093547-6', barcode: '9780060935476', title: 'The Lion, the Witch and the Wardrobe', author: 'C.S. Lewis', publisher: 'HarperCollins', category: 'Children', description: 'A fantasy novel for children.', cost_price: 6.99, selling_price: 12.99, image_url: '', created_at: date(300), updated_at: date(0) },
  { id: id('book',50), isbn: '978-0-06-093547-7', barcode: '9780060935477', title: 'Matilda', author: 'Roald Dahl', publisher: 'Puffin', category: 'Children', description: 'A story about a brilliant girl.', cost_price: 5.99, selling_price: 11.99, image_url: '', created_at: date(290), updated_at: date(0) },
  { id: id('book',51), isbn: '978-0-06-093547-8', barcode: '9780060935478', title: 'The Road Not Taken', author: 'Robert Frost', publisher: 'Holt', category: 'Poetry', description: 'Collected poems of Robert Frost.', cost_price: 8.99, selling_price: 15.99, image_url: '', created_at: date(300), updated_at: date(0) },
  { id: id('book',52), isbn: '978-0-06-093547-9', barcode: '9780060935479', title: 'Leaves of Grass', author: 'Walt Whitman', publisher: 'Penguin Classics', category: 'Poetry', description: 'A collection of poetry.', cost_price: 7.50, selling_price: 13.99, image_url: '', created_at: date(300), updated_at: date(0) },
  { id: id('book',53), isbn: '978-0-06-093548-0', barcode: '9780060935480', title: 'Milk and Honey', author: 'Rupi Kaur', publisher: 'Andrews McMeel', category: 'Poetry', description: 'Modern poetry about love, loss, and healing.', cost_price: 8.99, selling_price: 15.99, image_url: '', created_at: date(200), updated_at: date(0) },
  { id: id('book',54), isbn: '978-0-06-093548-1', barcode: '9780060935481', title: 'The Sun and Her Flowers', author: 'Rupi Kaur', publisher: 'Andrews McMeel', category: 'Poetry', description: 'A journey of wilting, falling, and growing.', cost_price: 9.50, selling_price: 16.99, image_url: '', created_at: date(180), updated_at: date(0) },
  { id: id('book',55), isbn: '978-0-06-093548-2', barcode: '9780060935482', title: 'The Waste Land', author: 'T.S. Eliot', publisher: 'Faber & Faber', category: 'Poetry', description: 'A modernist masterpiece.', cost_price: 6.99, selling_price: 12.50, image_url: '', created_at: date(300), updated_at: date(0) },
  { id: id('book',56), isbn: '978-0-06-093548-3', barcode: '9780060935483', title: 'The Story of Art', author: 'E.H. Gombrich', publisher: 'Phaidon', category: 'Art', description: 'The most famous art book ever published.', cost_price: 20.99, selling_price: 35.99, image_url: '', created_at: date(300), updated_at: date(0) },
  { id: id('book',57), isbn: '978-0-06-093548-4', barcode: '9780060935484', title: 'Ways of Seeing', author: 'John Berger', publisher: 'Penguin', category: 'Art', description: 'A profound analysis of how we view art.', cost_price: 8.99, selling_price: 15.99, image_url: '', created_at: date(300), updated_at: date(0) },
  { id: id('book',58), isbn: '978-0-06-093548-5', barcode: '9780060935485', title: 'Steal Like an Artist', author: 'Austin Kleon', publisher: 'Workman', category: 'Art', description: '10 things nobody told you about being creative.', cost_price: 7.99, selling_price: 14.99, image_url: '', created_at: date(250), updated_at: date(0) },
  { id: id('book',59), isbn: '978-0-06-093548-6', barcode: '9780060935486', title: 'The War of Art', author: 'Steven Pressfield', publisher: 'Black Irish', category: 'Art', description: 'Break through the blocks.', cost_price: 9.50, selling_price: 16.99, image_url: '', created_at: date(280), updated_at: date(0) },
  { id: id('book',60), isbn: '978-0-06-093548-7', barcode: '9780060935487', title: 'Big Magic', author: 'Elizabeth Gilbert', publisher: 'Riverhead', category: 'Art', description: 'Creative living beyond fear.', cost_price: 10.99, selling_price: 18.99, image_url: '', created_at: date(230), updated_at: date(0) },
  { id: id('book',61), isbn: '978-0-06-093549-0', barcode: '9780060935490', title: 'Dune', author: 'Frank Herbert', publisher: 'Ace', category: 'Fiction', description: 'A science fiction masterpiece.', cost_price: 9.99, selling_price: 17.99, image_url: '', created_at: date(300), updated_at: date(0) },
  { id: id('book',62), isbn: '978-0-06-093549-1', barcode: '9780060935491', title: 'Foundation', author: 'Isaac Asimov', publisher: 'Bantam Spectra', category: 'Fiction', description: 'The first novel in the Foundation series.', cost_price: 8.99, selling_price: 15.99, image_url: '', created_at: date(300), updated_at: date(0) },
  { id: id('book',63), isbn: '978-0-06-093549-2', barcode: '9780060935492', title: 'Neuromancer', author: 'William Gibson', publisher: 'Bantam Spectra', category: 'Fiction', description: 'The pioneering cyberpunk novel.', cost_price: 8.50, selling_price: 15.50, image_url: '', created_at: date(300), updated_at: date(0) },
  { id: id('book',64), isbn: '978-0-06-093549-3', barcode: '9780060935493', title: 'The Hitchhikers Guide to the Galaxy', author: 'Douglas Adams', publisher: 'Del Rey', category: 'Fiction', description: 'A comic science fiction series.', cost_price: 7.99, selling_price: 14.99, image_url: '', created_at: date(300), updated_at: date(0) },
  { id: id('book',65), isbn: '978-0-06-093549-4', barcode: '9780060935494', title: 'Enders Game', author: 'Orson Scott Card', publisher: 'Tor Books', category: 'Fiction', description: 'A military science fiction novel.', cost_price: 8.99, selling_price: 15.99, image_url: '', created_at: date(300), updated_at: date(0) },
  { id: id('book',66), isbn: '978-0-06-093549-5', barcode: '9780060935495', title: 'The Power of Habit', author: 'Charles Duhigg', publisher: 'Random House', category: 'Self-Help', description: 'Why we do what we do.', cost_price: 10.99, selling_price: 18.99, image_url: '', created_at: date(260), updated_at: date(0) },
  { id: id('book',67), isbn: '978-0-06-093549-6', barcode: '9780060935496', title: 'Mindset', author: 'Carol S. Dweck', publisher: 'Ballantine', category: 'Self-Help', description: 'The new psychology of success.', cost_price: 9.99, selling_price: 17.99, image_url: '', created_at: date(270), updated_at: date(0) },
  { id: id('book',68), isbn: '978-0-06-093549-7', barcode: '9780060935497', title: 'Grit', author: 'Angela Duckworth', publisher: 'Scribner', category: 'Self-Help', description: 'The power of passion and perseverance.', cost_price: 11.50, selling_price: 19.99, image_url: '', created_at: date(240), updated_at: date(0) },
  { id: id('book',69), isbn: '978-0-06-093549-8', barcode: '9780060935498', title: 'The Subtle Art of Not Giving a F*ck', author: 'Mark Manson', publisher: 'HarperOne', category: 'Self-Help', description: 'A counterintuitive approach to living a good life.', cost_price: 10.99, selling_price: 19.50, image_url: '', created_at: date(220), updated_at: date(0) },
  { id: id('book',70), isbn: '978-0-06-093549-9', barcode: '9780060935499', title: 'Ikigai', author: 'Héctor García', publisher: 'Penguin Life', category: 'Self-Help', description: 'The Japanese secret to a long and happy life.', cost_price: 9.50, selling_price: 16.99, image_url: '', created_at: date(200), updated_at: date(0) },
  { id: id('book',71), isbn: '978-0-06-093550-0', barcode: '9780060935500', title: 'Steve Jobs', author: 'Walter Isaacson', publisher: 'Simon & Schuster', category: 'Biography', description: 'The authorized biography of Steve Jobs.', cost_price: 14.99, selling_price: 24.99, image_url: '', created_at: date(300), updated_at: date(0) },
  { id: id('book',72), isbn: '978-0-06-093550-1', barcode: '9780060935501', title: 'Einstein: His Life and Universe', author: 'Walter Isaacson', publisher: 'Simon & Schuster', category: 'Biography', description: 'A comprehensive biography of Albert Einstein.', cost_price: 13.99, selling_price: 23.99, image_url: '', created_at: date(300), updated_at: date(0) },
  { id: id('book',73), isbn: '978-0-06-093550-2', barcode: '9780060935502', title: 'Leonardo da Vinci', author: 'Walter Isaacson', publisher: 'Simon & Schuster', category: 'Biography', description: 'The biography of the Renaissance genius.', cost_price: 15.99, selling_price: 27.99, image_url: '', created_at: date(250), updated_at: date(0) },
  { id: id('book',74), isbn: '978-0-06-093550-3', barcode: '9780060935503', title: 'Long Walk to Freedom', author: 'Nelson Mandela', publisher: 'Back Bay Books', category: 'Biography', description: 'The autobiography of Nelson Mandela.', cost_price: 12.99, selling_price: 21.99, image_url: '', created_at: date(300), updated_at: date(0) },
  { id: id('book',75), isbn: '978-0-06-093550-4', barcode: '9780060935504', title: 'The Diary of a Young Girl', author: 'Anne Frank', publisher: 'Bantam', category: 'Biography', description: 'The diary of Anne Frank during WWII.', cost_price: 6.99, selling_price: 12.99, image_url: '', created_at: date(300), updated_at: date(0) },
  { id: id('book',76), isbn: '978-0-06-093550-5', barcode: '9780060935505', title: 'The Gene', author: 'Siddhartha Mukherjee', publisher: 'Scribner', category: 'Science', description: 'An intimate history of the gene.', cost_price: 13.99, selling_price: 24.99, image_url: '', created_at: date(230), updated_at: date(0) },
  { id: id('book',77), isbn: '978-0-06-093550-6', barcode: '9780060935506', title: 'Astrophysics for People in a Hurry', author: 'Neil deGrasse Tyson', publisher: 'W.W. Norton', category: 'Science', description: 'Essential cosmic knowledge in a nutshell.', cost_price: 10.50, selling_price: 18.99, image_url: '', created_at: date(210), updated_at: date(0) },
  { id: id('book',78), isbn: '978-0-06-093550-7', barcode: '9780060935507', title: 'The Elegant Universe', author: 'Brian Greene', publisher: 'W.W. Norton', category: 'Science', description: 'String theory and the fabric of the cosmos.', cost_price: 12.99, selling_price: 22.99, image_url: '', created_at: date(300), updated_at: date(0) },
  { id: id('book',79), isbn: '978-0-06-093550-8', barcode: '9780060935508', title: 'Silent Spring', author: 'Rachel Carson', publisher: 'Houghton Mifflin', category: 'Science', description: 'The book that launched the environmental movement.', cost_price: 8.99, selling_price: 15.99, image_url: '', created_at: date(300), updated_at: date(0) },
  { id: id('book',80), isbn: '978-0-06-093550-9', barcode: '9780060935509', title: 'The Origin of Species', author: 'Charles Darwin', publisher: 'Penguin Classics', category: 'Science', description: 'Darwins groundbreaking work on evolution.', cost_price: 7.99, selling_price: 14.99, image_url: '', created_at: date(300), updated_at: date(0) },
  { id: id('book',81), isbn: '978-0-06-093551-0', barcode: '9780060935510', title: 'Rich Dad Poor Dad', author: 'Robert Kiyosaki', publisher: 'Plata Publishing', category: 'Business', description: 'What the rich teach their kids about money.', cost_price: 9.99, selling_price: 17.99, image_url: '', created_at: date(300), updated_at: date(0) },
  { id: id('book',82), isbn: '978-0-06-093551-1', barcode: '9780060935511', title: 'Think and Grow Rich', author: 'Napoleon Hill', publisher: 'TarcherPerigee', category: 'Business', description: 'The classic guide to wealth building.', cost_price: 8.50, selling_price: 15.99, image_url: '', created_at: date(300), updated_at: date(0) },
  { id: id('book',83), isbn: '978-0-06-093551-2', barcode: '9780060935512', title: 'The 4-Hour Work Week', author: 'Tim Ferriss', publisher: 'Harmony', category: 'Business', description: 'Escape 9-5, live anywhere, join the new rich.', cost_price: 11.99, selling_price: 20.99, image_url: '', created_at: date(280), updated_at: date(0) },
  { id: id('book',84), isbn: '978-0-06-093551-3', barcode: '9780060935513', title: 'Start With Why', author: 'Simon Sinek', publisher: 'Portfolio', category: 'Business', description: 'How great leaders inspire everyone to take action.', cost_price: 10.99, selling_price: 19.99, image_url: '', created_at: date(260), updated_at: date(0) },
  { id: id('book',85), isbn: '978-0-06-093551-4', barcode: '9780060935514', title: 'Rework', author: 'Jason Fried', publisher: 'Currency', category: 'Business', description: 'A better, faster, easier way to succeed in business.', cost_price: 10.50, selling_price: 18.99, image_url: '', created_at: date(270), updated_at: date(0) },
  { id: id('book',86), isbn: '978-0-06-093551-5', barcode: '9780060935515', title: 'Pride and Prejudice', author: 'Jane Austen', publisher: 'Penguin Classics', category: 'Fiction', description: 'A romantic novel of manners.', cost_price: 5.99, selling_price: 10.99, image_url: '', created_at: date(300), updated_at: date(0) },
  { id: id('book',87), isbn: '978-0-06-093551-6', barcode: '9780060935516', title: 'Jane Eyre', author: 'Charlotte Brontë', publisher: 'Penguin Classics', category: 'Fiction', description: 'A novel of passion and independence.', cost_price: 6.50, selling_price: 11.99, image_url: '', created_at: date(300), updated_at: date(0) },
  { id: id('book',88), isbn: '978-0-06-093551-7', barcode: '9780060935517', title: 'Wuthering Heights', author: 'Emily Brontë', publisher: 'Penguin Classics', category: 'Fiction', description: 'A wild, passionate tale of love.', cost_price: 6.50, selling_price: 11.99, image_url: '', created_at: date(300), updated_at: date(0) },
  { id: id('book',89), isbn: '978-0-06-093551-8', barcode: '9780060935518', title: 'The Count of Monte Cristo', author: 'Alexandre Dumas', publisher: 'Penguin Classics', category: 'Fiction', description: 'An adventure novel of revenge.', cost_price: 8.99, selling_price: 15.99, image_url: '', created_at: date(300), updated_at: date(0) },
  { id: id('book',90), isbn: '978-0-06-093551-9', barcode: '9780060935519', title: 'Don Quixote', author: 'Miguel de Cervantes', publisher: 'Penguin Classics', category: 'Fiction', description: 'The first modern novel.', cost_price: 9.50, selling_price: 16.99, image_url: '', created_at: date(300), updated_at: date(0) },
  { id: id('book',91), isbn: '978-0-06-093552-0', barcode: '9780060935520', title: 'You Are a Badass', author: 'Jen Sincero', publisher: 'Running Press', category: 'Self-Help', description: 'How to stop doubting your greatness.', cost_price: 9.99, selling_price: 17.50, image_url: '', created_at: date(230), updated_at: date(0) },
  { id: id('book',92), isbn: '978-0-06-093552-1', barcode: '9780060935521', title: 'Mans Search for Meaning', author: 'Viktor E. Frankl', publisher: 'Beacon Press', category: 'Philosophy', description: 'Finding purpose through suffering.', cost_price: 7.99, selling_price: 14.99, image_url: '', created_at: date(300), updated_at: date(0) },
  { id: id('book',93), isbn: '978-0-06-093552-2', barcode: '9780060935522', title: 'The Prince', author: 'Niccolò Machiavelli', publisher: 'Penguin Classics', category: 'Philosophy', description: 'A treatise on political power.', cost_price: 5.99, selling_price: 10.99, image_url: '', created_at: date(300), updated_at: date(0) },
  { id: id('book',94), isbn: '978-0-06-093552-3', barcode: '9780060935523', title: 'Sapiens Graphic Novel', author: 'Yuval Noah Harari', publisher: 'Harper', category: 'Non-Fiction', description: 'The graphic adaptation of Sapiens.', cost_price: 16.99, selling_price: 29.99, image_url: '', created_at: date(100), updated_at: date(0) },
  { id: id('book',95), isbn: '978-0-06-093552-4', barcode: '9780060935524', title: 'The Phoenix Project', author: 'Gene Kim', publisher: 'IT Revolution', category: 'Technology', description: 'A novel about IT, DevOps, and business.', cost_price: 13.99, selling_price: 24.99, image_url: '', created_at: date(250), updated_at: date(0) },
  { id: id('book',96), isbn: '978-0-06-093552-5', barcode: '9780060935525', title: 'Refactoring', author: 'Martin Fowler', publisher: 'Addison-Wesley', category: 'Technology', description: 'Improving the design of existing code.', cost_price: 28.99, selling_price: 49.99, image_url: '', created_at: date(300), updated_at: date(0) },
  { id: id('book',97), isbn: '978-0-06-093552-6', barcode: '9780060935526', title: 'The Midnight Library', author: 'Matt Haig', publisher: 'Viking', category: 'Fiction', description: 'A novel about all the lives you could have lived.', cost_price: 10.99, selling_price: 18.99, image_url: '', created_at: date(150), updated_at: date(0) },
  { id: id('book',98), isbn: '978-0-06-093552-7', barcode: '9780060935527', title: 'Project Hail Mary', author: 'Andy Weir', publisher: 'Ballantine', category: 'Fiction', description: 'A lone astronaut must save Earth.', cost_price: 12.99, selling_price: 22.99, image_url: '', created_at: date(130), updated_at: date(0) },
  { id: id('book',99), isbn: '978-0-06-093552-8', barcode: '9780060935528', title: 'Klara and the Sun', author: 'Kazuo Ishiguro', publisher: 'Knopf', category: 'Fiction', description: 'A novel about an AI and what it means to love.', cost_price: 11.99, selling_price: 20.99, image_url: '', created_at: date(120), updated_at: date(0) },
  { id: id('book',100), isbn: '978-0-06-093552-9', barcode: '9780060935529', title: 'The Thursday Murder Club', author: 'Richard Osman', publisher: 'Viking', category: 'Fiction', description: 'Four unlikely friends investigate a murder.', cost_price: 10.50, selling_price: 18.99, image_url: '', created_at: date(140), updated_at: date(0) },
];

// ============================================
// BRANCH INVENTORY
// ============================================
export function generateInventory(): BranchInventory[] {
  const inv: BranchInventory[] = [];
  let counter = 1;
  for (const branch of branches) {
    for (const book of books) {
      const qty = Math.floor(Math.random() * 50) + 1;
      inv.push({
        id: id('inv', counter++),
        book_id: book.id,
        branch_id: branch.id,
        quantity: qty,
        reorder_level: Math.floor(Math.random() * 5) + 3,
        last_restocked: date(Math.floor(Math.random() * 30)),
      });
    }
  }
  return inv;
}

export const inventory: BranchInventory[] = generateInventory();

// ============================================
// SALES
// ============================================
export function generateSales(): { sales: Sale[]; saleItems: SaleItem[] } {
  const salesArr: Sale[] = [];
  const itemsArr: SaleItem[] = [];
  let saleCounter = 1;
  let itemCounter = 1;
  const methods: ('cash' | 'card' | 'mobile')[] = ['cash', 'card', 'mobile'];
  const customerNames = ['John Smith', 'Emily Davis', 'Chris Brown', 'Jessica Wilson', 'Daniel Moore', 'Ashley Taylor', 'Matthew Anderson', 'Amanda Thomas', 'Joshua Jackson', 'Stephanie White', 'Andrew Harris', 'Nicole Martin', 'Ryan Thompson', 'Samantha Garcia', 'Brandon Martinez'];

  for (let day = 0; day < 90; day++) {
    const salesPerDay = Math.floor(Math.random() * 15) + 5;
    for (let s = 0; s < salesPerDay; s++) {
      const branch = branches[Math.floor(Math.random() * branches.length)];
      const branchCashiers = users.filter(u => u.role === 'cashier' && u.branch_id === branch.id);
      const cashier = branchCashiers.length > 0
        ? branchCashiers[Math.floor(Math.random() * branchCashiers.length)]
        : users[4];
      const numItems = Math.floor(Math.random() * 4) + 1;
      const saleId = id('sale', saleCounter++);
      let subtotal = 0;
      const usedBooks = new Set<string>();

      for (let i = 0; i < numItems; i++) {
        const book = books[Math.floor(Math.random() * books.length)];
        if (usedBooks.has(book.id)) continue;
        usedBooks.add(book.id);
        const qty = Math.floor(Math.random() * 3) + 1;
        const itemDiscount = Math.random() > 0.8 ? Math.round(book.selling_price * 0.1 * 100) / 100 : 0;
        const itemTotal = (book.selling_price * qty) - itemDiscount;
        subtotal += itemTotal;
        itemsArr.push({
          id: id('si', itemCounter++),
          sale_id: saleId,
          book_id: book.id,
          quantity: qty,
          unit_price: book.selling_price,
          discount: itemDiscount,
          total: Math.round(itemTotal * 100) / 100,
        });
      }

      const discountPct = Math.random() > 0.7 ? Math.floor(Math.random() * 10) + 1 : 0;
      const discountAmt = Math.round((subtotal * discountPct) / 100 * 100) / 100;
      const taxAmt = Math.round((subtotal - discountAmt) * 0.05 * 100) / 100;
      const total = Math.round((subtotal - discountAmt + taxAmt) * 100) / 100;
      const custName = customerNames[Math.floor(Math.random() * customerNames.length)];

      salesArr.push({
        id: saleId,
        branch_id: branch.id,
        cashier_id: cashier.id,
        customer_name: custName,
        customer_email: `${custName.toLowerCase().replace(' ', '.')}@email.com`,
        customer_phone: `+1-555-${String(Math.floor(Math.random() * 9000) + 1000)}`,
        subtotal: Math.round(subtotal * 100) / 100,
        discount_amount: discountAmt,
        discount_type: 'percentage',
        tax_amount: taxAmt,
        total,
        payment_method: methods[Math.floor(Math.random() * methods.length)],
        status: 'completed',
        notes: '',
        created_at: date(day),
      });
    }
  }
  return { sales: salesArr, saleItems: itemsArr };
}

const { sales: generatedSales, saleItems: generatedSaleItems } = generateSales();
export const sales: Sale[] = generatedSales;
export const saleItems: SaleItem[] = generatedSaleItems;

// ============================================
// STOCK TRANSFERS
// ============================================
export const stockTransfers: StockTransfer[] = [
  { id: 'txfr_001', book_id: 'book_0001', from_branch_id: 'branch_001', to_branch_id: 'branch_002', quantity: 10, status: 'completed', requested_by: 'user_003', approved_by: 'user_001', notes: 'University branch running low', created_at: date(15), updated_at: date(14) },
  { id: 'txfr_002', book_id: 'book_0018', from_branch_id: 'branch_001', to_branch_id: 'branch_003', quantity: 5, status: 'completed', requested_by: 'user_004', approved_by: 'user_001', notes: 'Westside Mall needs more Atomic Habits', created_at: date(10), updated_at: date(9) },
  { id: 'txfr_003', book_id: 'book_0029', from_branch_id: 'branch_002', to_branch_id: 'branch_001', quantity: 8, status: 'pending', requested_by: 'user_002', approved_by: null, notes: 'Downtown needs Clean Code', created_at: date(2), updated_at: date(2) },
  { id: 'txfr_004', book_id: 'book_0048', from_branch_id: 'branch_003', to_branch_id: 'branch_002', quantity: 15, status: 'approved', requested_by: 'user_003', approved_by: 'user_001', notes: 'Harry Potter is selling fast', created_at: date(1), updated_at: date(1) },
];

// ============================================
// EXPENSES
// ============================================
export function generateExpenses(): Expense[] {
  const categories = ['Rent', 'Utilities', 'Staff Salaries', 'Maintenance', 'Marketing', 'Supplies', 'Insurance', 'Equipment'];
  const exps: Expense[] = [];
  let c = 1;
  for (let month = 0; month < 3; month++) {
    for (const branch of branches) {
      for (const cat of categories) {
        const amounts: Record<string, number> = {
          'Rent': 3000 + Math.random() * 2000,
          'Utilities': 200 + Math.random() * 300,
          'Staff Salaries': 8000 + Math.random() * 4000,
          'Maintenance': 100 + Math.random() * 400,
          'Marketing': 300 + Math.random() * 700,
          'Supplies': 150 + Math.random() * 350,
          'Insurance': 500 + Math.random() * 500,
          'Equipment': 200 + Math.random() * 800,
        };
        exps.push({
          id: id('exp', c++),
          branch_id: branch.id,
          category: cat,
          description: `${cat} for ${branch.name}`,
          amount: Math.round((amounts[cat] || 500) * 100) / 100,
          date: date(month * 30 + Math.floor(Math.random() * 28)),
          created_by: 'user_001',
          created_at: date(month * 30),
        });
      }
    }
  }
  return exps;
}

export const expenses: Expense[] = generateExpenses();

// ============================================
// NOTIFICATIONS
// ============================================
export const notifications: Notification[] = [
  { id: 'notif_001', user_id: 'user_001', type: 'low_stock', title: 'Low Stock Alert', message: 'The Great Gatsby is running low at Downtown Flagship (3 copies left)', is_read: false, metadata: '{}', created_at: date(0) },
  { id: 'notif_002', user_id: 'user_001', type: 'new_sale', title: 'New Sale Completed', message: 'Sale #1247 completed at University District — $45.99', is_read: false, metadata: '{}', created_at: date(0) },
  { id: 'notif_003', user_id: 'user_001', type: 'target_reached', title: 'Sales Target Reached!', message: 'Downtown Flagship has reached its daily sales target of $2,000', is_read: false, metadata: '{}', created_at: date(0) },
  { id: 'notif_004', user_id: 'user_001', type: 'employee_login', title: 'Employee Login', message: 'Michael Johnson logged in at Downtown Flagship', is_read: true, metadata: '{}', created_at: date(0) },
  { id: 'notif_005', user_id: 'user_001', type: 'stock_transfer', title: 'Stock Transfer Request', message: 'Sarah Mitchell requested 8 copies of Clean Code from University District', is_read: false, metadata: '{}', created_at: date(1) },
  { id: 'notif_006', user_id: 'user_001', type: 'low_stock', title: 'Low Stock Alert', message: 'Atomic Habits is low at Westside Mall (2 copies left)', is_read: true, metadata: '{}', created_at: date(1) },
  { id: 'notif_007', user_id: 'user_001', type: 'new_sale', title: 'New Sale Completed', message: 'Sale #1248 completed at Westside Mall — $89.97', is_read: true, metadata: '{}', created_at: date(1) },
  { id: 'notif_008', user_id: 'user_001', type: 'system', title: 'System Update', message: 'Monthly analytics report is ready for download', is_read: false, metadata: '{}', created_at: date(2) },
];

// ============================================
// AUDIT LOGS
// ============================================
export const auditLogs: AuditLog[] = [
  { id: 'log_001', user_id: 'user_001', action: 'LOGIN', entity_type: 'auth', entity_id: 'user_001', details: 'Super Admin logged in', ip_address: '192.168.1.1', created_at: date(0) },
  { id: 'log_002', user_id: 'user_005', action: 'LOGIN', entity_type: 'auth', entity_id: 'user_005', details: 'Cashier logged in at Downtown Flagship', ip_address: '192.168.1.10', created_at: date(0) },
  { id: 'log_003', user_id: 'user_005', action: 'CREATE_SALE', entity_type: 'sale', entity_id: 'sale_0001', details: 'Created sale #0001 — $45.99', ip_address: '192.168.1.10', created_at: date(0) },
  { id: 'log_004', user_id: 'user_001', action: 'STOCK_TRANSFER', entity_type: 'transfer', entity_id: 'txfr_001', details: 'Approved stock transfer of 10 copies', ip_address: '192.168.1.1', created_at: date(1) },
  { id: 'log_005', user_id: 'user_002', action: 'UPDATE_BOOK', entity_type: 'book', entity_id: 'book_0001', details: 'Updated price of To Kill a Mockingbird', ip_address: '192.168.1.20', created_at: date(2) },
];
