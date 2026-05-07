// Shop info — placeholders. Edit these to match HT BOOK SHOP details.
export const SHOP = {
  name: "HT BOOK SHOP",
  city: "Horowapothana",
  address: "Anuradhapura Road, Horowapothana",
  phone: "+94771102030",
  whatsapp: "94771102030", // no '+'
  facebook: "https://www.facebook.com/htbookshop",
  mapsQuery: "HT+BOOK+SHOP+Horowapothana",
  mapsEmbed:
    "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3945.493247923705!2d80.82857767477174!3d8.548475796326164!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3afb878f73cbf923%3A0xf937bcb0eccb7bdd!2sHT%20BOOK%20SHOP!5e0!3m2!1sen!2slk!4v1778146904571!5m2!1sen!2slk",
};

export const GRADES = [
  "Grade 1","Grade 2","Grade 3","Grade 4","Grade 5",
  "Grade 6","Grade 7","Grade 8","Grade 9",
  "Grade 10","Grade 11","O/L","A/L","Other",
];

export const DISTRICTS = [
  "Colombo","Gampaha","Kalutara","Kandy","Matale","Nuwara Eliya",
  "Galle","Matara","Hambantota","Jaffna","Kilinochchi","Mannar",
  "Mullaitivu","Vavuniya","Trincomalee","Batticaloa","Ampara",
  "Kurunegala","Puttalam","Anuradhapura","Polonnaruwa","Badulla",
  "Monaragala","Ratnapura","Kegalle",
];

export function formatLKR(n: number) {
  return new Intl.NumberFormat("en-LK", { style: "currency", currency: "LKR", maximumFractionDigits: 0 }).format(n);
}
