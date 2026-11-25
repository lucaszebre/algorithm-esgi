import type { Category, Product } from '../types';

/** [name, category, price, stock, rating, description] */
type ProductRow = [string, Category, number, number, number, string];

// Kept as rows to stay readable; ids are assigned from the position (1-based).
// Some prices and ratings repeat on purpose, to check that sorts handle ties.
const rows: ProductRow[] = [
  ['Wireless Headphones', 'Electronics', 89.99, 34, 4.5, 'Over-ear Bluetooth headphones with active noise cancelling and 30 hours of battery.'],
  ['Mechanical Keyboard', 'Electronics', 119.0, 12, 4.7, 'Tenkeyless keyboard with hot-swappable switches and per-key RGB lighting.'],
  ['USB-C Hub', 'Electronics', 39.9, 80, 4.1, '7-in-1 hub: HDMI 4K, SD card reader, 3 USB-A ports and 100 W power delivery.'],
  ['27" 4K Monitor', 'Electronics', 329.0, 7, 4.6, 'IPS panel with 99% sRGB coverage, height-adjustable stand and USB-C input.'],
  ['Wireless Mouse', 'Electronics', 24.99, 120, 4.2, 'Ergonomic silent mouse with a 2.4 GHz receiver and 18 months of battery life.'],
  ['Smartwatch', 'Electronics', 199.0, 21, 4.0, 'Fitness tracking, heart-rate sensor, GPS and a 5-day battery.'],
  ['Portable Speaker', 'Electronics', 59.99, 45, 4.4, 'Waterproof IP67 Bluetooth speaker with 360° sound.'],
  ['External SSD 1 TB', 'Electronics', 99.0, 60, 4.8, 'Pocket-sized NVMe SSD with read speeds up to 1050 MB/s over USB-C.'],
  ['Webcam 1080p', 'Electronics', 49.5, 0, 3.9, 'Full HD webcam with auto-focus and dual noise-reducing microphones.'],
  ['E-Reader', 'Electronics', 129.99, 18, 4.6, '6.8" glare-free display with adjustable warm light, waterproof.'],

  ['Introduction to Algorithms', 'Books', 79.0, 15, 4.8, 'The classic CLRS reference covering sorting, graphs, dynamic programming and more.'],
  ['Clean Code', 'Books', 34.5, 40, 4.5, 'A handbook of agile software craftsmanship by Robert C. Martin.'],
  ['The Pragmatic Programmer', 'Books', 39.9, 22, 4.7, 'Timeless advice on becoming a better developer, 20th anniversary edition.'],
  ['Eloquent JavaScript', 'Books', 29.99, 30, 4.4, 'A modern introduction to programming with JavaScript.'],
  ['Programming TypeScript', 'Books', 44.0, 9, 4.3, 'Making your JavaScript applications scale with a strong type system.'],
  ['Grokking Algorithms', 'Books', 34.5, 27, 4.6, 'An illustrated guide to algorithms for programmers and other curious people.'],
  ['Design Patterns', 'Books', 49.99, 11, 4.5, 'Elements of reusable object-oriented software by the Gang of Four.'],
  ['Refactoring', 'Books', 47.0, 0, 4.6, 'Improving the design of existing code, second edition with JavaScript examples.'],
  ['Structure and Interpretation of Computer Programs', 'Books', 55.0, 5, 4.7, 'The MIT textbook on abstraction, recursion and interpreters.'],
  ['You Don\'t Know JS Yet', 'Books', 24.99, 33, 4.2, 'A deep dive into the core mechanisms of the JavaScript language.'],

  ['Hoodie', 'Clothing', 45.0, 50, 4.3, 'Heavyweight organic cotton hoodie with a kangaroo pocket.'],
  ['Running Shoes', 'Clothing', 109.9, 26, 4.5, 'Lightweight running shoes with a responsive foam midsole.'],
  ['Denim Jacket', 'Clothing', 79.0, 14, 4.1, 'Classic fit denim jacket in rigid indigo cotton.'],
  ['Wool Beanie', 'Clothing', 19.99, 90, 4.0, 'Ribbed merino wool beanie, one size fits all.'],
  ['Rain Jacket', 'Clothing', 89.99, 17, 4.4, 'Packable waterproof shell with taped seams and an adjustable hood.'],
  ['Cotton T-Shirt', 'Clothing', 14.99, 200, 4.2, 'Regular fit crew neck t-shirt in 100% organic cotton.'],
  ['Chino Pants', 'Clothing', 54.5, 38, 3.8, 'Slim fit stretch chinos with a tapered leg.'],
  ['Leather Belt', 'Clothing', 29.0, 64, 4.3, 'Full-grain leather belt with a brushed steel buckle.'],
  ['Wool Socks (3 pairs)', 'Clothing', 17.5, 110, 4.6, 'Cushioned merino socks that keep feet warm and dry.'],
  ['Winter Parka', 'Clothing', 189.0, 6, 4.7, 'Insulated parka rated down to -20 °C, with a faux-fur hood.'],

  ['Coffee Maker', 'Home', 69.99, 23, 4.3, 'Programmable 12-cup drip coffee maker with a thermal carafe.'],
  ['Desk Lamp', 'Home', 34.99, 47, 4.4, 'LED desk lamp with 5 colour temperatures and a USB charging port.'],
  ['Office Chair', 'Home', 249.0, 8, 4.5, 'Ergonomic mesh chair with lumbar support and adjustable armrests.'],
  ['Standing Desk', 'Home', 399.0, 4, 4.6, 'Electric height-adjustable desk with memory presets, 140 × 70 cm.'],
  ['Chef\'s Knife', 'Home', 59.0, 31, 4.8, '20 cm German stainless steel chef\'s knife, full tang.'],
  ['Cast Iron Skillet', 'Home', 39.9, 29, 4.7, 'Pre-seasoned 26 cm cast iron skillet, oven safe.'],
  ['Throw Blanket', 'Home', 29.99, 55, 4.2, 'Soft knitted throw blanket, 130 × 170 cm.'],
  ['Indoor Plant Pot', 'Home', 19.99, 72, 4.0, 'Ceramic pot with a drainage hole and a bamboo saucer.'],
  ['Electric Kettle', 'Home', 44.5, 0, 4.4, '1.7 L stainless steel kettle with temperature control.'],
  ['Bookshelf', 'Home', 89.0, 10, 4.1, '5-tier oak-finish bookshelf, 180 cm tall.'],

  ['Yoga Mat', 'Sports', 29.99, 66, 4.5, 'Non-slip 6 mm yoga mat with a carrying strap.'],
  ['Adjustable Dumbbells', 'Sports', 149.0, 13, 4.6, 'Pair of dumbbells adjustable from 2.5 to 24 kg with a dial.'],
  ['Road Bike Helmet', 'Sports', 69.0, 19, 4.4, 'Lightweight ventilated helmet with MIPS protection.'],
  ['Tennis Racket', 'Sports', 119.0, 9, 4.3, 'Graphite racket, 300 g, suited for intermediate players.'],
  ['Football', 'Sports', 24.99, 85, 4.2, 'Size 5 match ball with a thermo-bonded surface.'],
  ['Resistance Bands Set', 'Sports', 19.99, 140, 4.1, 'Five latex bands with handles, door anchor and ankle straps.'],
  ['Water Bottle', 'Sports', 14.99, 160, 4.7, 'Insulated 750 ml stainless steel bottle, keeps drinks cold for 24 h.'],
  ['Jump Rope', 'Sports', 9.99, 95, 4.0, 'Speed jump rope with ball bearings and an adjustable steel cable.'],
  ['Hiking Backpack', 'Sports', 99.0, 16, 4.6, '35 L backpack with a rain cover and a ventilated back panel.'],
  ['Climbing Shoes', 'Sports', 89.0, 3, 4.5, 'Downturned climbing shoes with sticky rubber soles.'],
];

/** The product catalogue, ordered by id. */
export const products: Product[] = rows.map(
  ([name, category, price, stock, rating, description], index) => ({
    id: index + 1,
    name,
    category,
    price,
    stock,
    rating,
    description,
  }),
);

export const categories: Category[] = ['Electronics', 'Books', 'Clothing', 'Home', 'Sports'];
