import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/campuscycle";

const STUDENTS = [
  {
    handle: "aarav-sharma",
    displayName: "Aarav Sharma",
    email: "aarav.sharma@campus.edu",
    campus: "North Campus",
    department: "Computer Science & Engineering",
    year: 3,
    bio: "Pre-final year CS student. Upgrading my tech gear and clearing out textbooks from semesters 1-4.",
    avatarUrl: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=256&q=80",
    contactPreference: "message",
  },
  {
    handle: "priya-patel",
    displayName: "Priya Patel",
    email: "priya.patel@campus.edu",
    campus: "Main Campus",
    department: "Mechanical Engineering",
    year: 4,
    bio: "Final year Mech student. Moving out of the hostel soon — selling drafting gear, cycles, and hostel items.",
    avatarUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=256&q=80",
    contactPreference: "either",
  },
  {
    handle: "rohan-mehta",
    displayName: "Rohan Mehta",
    email: "rohan.mehta@campus.edu",
    campus: "South Campus",
    department: "Electrical Engineering",
    year: 2,
    bio: "Sophomore EE enthusiast. Always tinkering with gadgets, lab components, and study equipment.",
    avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=256&q=80",
    contactPreference: "message",
  },
  {
    handle: "ananya-iyer",
    displayName: "Ananya Iyer",
    email: "ananya.iyer@campus.edu",
    campus: "North Campus",
    department: "Architecture & Design",
    year: 3,
    bio: "Architecture junior. Selling art supplies, drafting boards, and room decor items in mint condition.",
    avatarUrl: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=256&q=80",
    contactPreference: "email",
  },
  {
    handle: "vikram-singh",
    displayName: "Vikram Singh",
    email: "vikram.singh@campus.edu",
    campus: "East Campus",
    department: "Civil Engineering",
    year: 4,
    bio: "Final year student. Campus sports coordinator. Selling fitness equipment, lab coats, and hostel essentials.",
    avatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=256&q=80",
    contactPreference: "message",
  },
  {
    handle: "neha-gupta",
    displayName: "Neha Gupta",
    email: "neha.gupta@campus.edu",
    campus: "Main Campus",
    department: "Mathematics & Computing",
    year: 2,
    bio: "Math & Computing sophomore. Giving away solved notes, reference books, and scientific calculators.",
    avatarUrl: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=256&q=80",
    contactPreference: "either",
  },
];

const PRODUCTS_DATA = [
  // ================= BOOKS & NOTES =================
  {
    category: "books",
    title: "Thomas' Calculus 14th Global Edition",
    description: "Original Pearson hardcover edition of Thomas' Calculus. Essential for first-year engineering mathematics (Math-1 & Math-2). Clean pages with zero pen marks, no missing pages, tight binding. Includes formula reference bookmark inside.",
    price: 650,
    listingType: "sale",
    condition: "like_new",
    location: "Central Library Reading Hall, Main Campus",
    tags: ["calculus", "mathematics", "textbook", "engineering", "pearson"],
    images: [
      "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=800&q=80",
    ],
    studentHandle: "aarav-sharma",
  },
  {
    category: "books",
    title: "Introduction to Algorithms (CLRS 3rd Edition)",
    description: "The gold standard textbook for Design and Analysis of Algorithms (DAA) and Data Structures. Paperback edition, neatly covered with transparent plastic wrap. Minimal pencil annotations in the dynamic programming chapters only.",
    price: 850,
    listingType: "sale",
    condition: "good",
    location: "Hostel Block 4, North Campus",
    tags: ["algorithms", "clrs", "computerscience", "coding", "mitpress"],
    images: [
      "https://images.unsplash.com/photo-1532012164546-f432f2e3777a?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=800&q=80",
    ],
    studentHandle: "neha-gupta",
  },
  {
    category: "books",
    title: "Complete Semester 1 & 2 Handwritten Notes Bundle",
    description: "Comprehensive class notes for Physics, Basic Electrical Engineering, and Engineering Mechanics. Neatly indexed with diagrams, solved university past question papers, and highlighted exam tips. Giving away free to help juniors!",
    price: 0,
    listingType: "free",
    condition: "good",
    location: "Student Activity Center (SAC) Cafeteria",
    tags: ["notes", "handwritten", "semester1", "examtips", "free"],
    images: [
      "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=800&q=80",
    ],
    studentHandle: "rohan-mehta",
  },
  {
    category: "books",
    title: "GRE Official Guide & Manhattan 5lb Book",
    description: "Want to exchange my GRE Official Guide 3rd Edition and Manhattan 5lb practice book for GATE CS reference material (Made Easy or Ace Academy postal study package). Both books are completely unmarked and in spotless condition.",
    price: 0,
    listingType: "exchange",
    exchangeFor: "GATE CS study material or standard Computer Networks book (Tanenbaum)",
    condition: "like_new",
    location: "Hostel Block 2 Common Room",
    tags: ["gre", "manhattan", "gate", "exchange", "higherstudies"],
    images: [
      "https://images.unsplash.com/photo-1513475382585-d06e58bcb0d0?auto=format&fit=crop&w=800&q=80",
    ],
    studentHandle: "aarav-sharma",
  },

  // ================= ELECTRONICS =================
  {
    category: "electronics",
    title: "Keychron K2 V2 Wireless Mechanical Keyboard",
    description: "75% compact wireless/wired mechanical keyboard with Gateron Brown switches and white LED backlight. Works seamlessly over Bluetooth with Mac, Windows, and iPad. Used for 6 months for coding. Original box, USB-C cable, and keycap puller included.",
    price: 3800,
    listingType: "sale",
    condition: "like_new",
    location: "Hostel 7, North Campus",
    tags: ["keyboard", "keychron", "mechanical", "bluetooth", "coding"],
    images: [
      "https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?auto=format&fit=crop&w=800&q=80",
    ],
    studentHandle: "aarav-sharma",
  },
  {
    category: "electronics",
    title: "Sony WH-CH720N Noise Cancelling Wireless Headphones",
    description: "Lightweight over-ear active noise cancelling Bluetooth headphones. Perfect for studying in noisy hostels or the library. 35-hour battery life with fast charging. In pristine condition with original AUX audio cable and charging cable.",
    price: 4500,
    listingType: "sale",
    condition: "like_new",
    location: "Main Gate Coffee Shop",
    tags: ["sony", "headphones", "anc", "wireless", "audio"],
    images: [
      "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1484704849700-f032a568e944?auto=format&fit=crop&w=800&q=80",
    ],
    studentHandle: "rohan-mehta",
  },
  {
    category: "electronics",
    title: "Logitech MX Master 2S Wireless Ergonomic Mouse",
    description: "Ergonomic precision mouse with hyperscroll wheel and side thumb wheel for horizontal scrolling. Connects via Bluetooth or Unifying receiver. Battery lasts nearly 2 months on a single charge. Smooth glide feet, all buttons perfectly tactile.",
    price: 2400,
    listingType: "sale",
    condition: "good",
    location: "Computer Center Plaza, South Campus",
    tags: ["logitech", "mxmaster", "mouse", "ergonomic", "productivity"],
    images: [
      "https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?auto=format&fit=crop&w=800&q=80",
    ],
    studentHandle: "priya-patel",
  },

  // ================= CALCULATORS =================
  {
    category: "calculators",
    title: "Casio FX-991EX ClassWiz Scientific Calculator",
    description: "The high-resolution ClassWiz model with 552 functions including matrix multiplication, numerical integration/differentiation, and equation solving. Approved for all semester exams. Comes with protective slide-on hard case. Solar panel and battery working 100%.",
    price: 850,
    listingType: "sale",
    condition: "like_new",
    location: "Hostel Block 3, North Campus",
    tags: ["casio", "fx991ex", "classwiz", "calculator", "engineering"],
    images: [
      "https://images.unsplash.com/photo-1594980596870-8aa52a78d8cd?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1587145820266-a5951ee6f620?auto=format&fit=crop&w=800&q=80",
    ],
    studentHandle: "neha-gupta",
  },
  {
    category: "calculators",
    title: "Texas Instruments TI-84 Plus CE Graphing Calculator",
    description: "High-resolution color backlit screen graphing calculator. Rechargeable battery, includes mini-USB charging cable and pre-loaded calculus & stats applications. Excellent for advanced mathematics, physics, and data analysis courses.",
    price: 4900,
    listingType: "sale",
    condition: "good",
    location: "Mathematics Department Faculty Porch",
    tags: ["ti84", "graphing", "texasinstruments", "math", "calculator"],
    images: [
      "https://images.unsplash.com/photo-1611125832047-1d7ad1e8e485?auto=format&fit=crop&w=800&q=80",
    ],
    studentHandle: "rohan-mehta",
  },
  {
    category: "calculators",
    title: "Casio FX-82MS Scientific Calculator (2nd Edition)",
    description: "2-line display scientific calculator with 240 functions. Standard model for basic physics and chemistry lab practicals. Fully functional, fresh battery replaced last week. Giving away free to any first-year student who needs one.",
    price: 0,
    listingType: "free",
    condition: "good",
    location: "Chemistry Department Ground Floor",
    tags: ["casio", "fx82ms", "free", "scientific", "calculator"],
    images: [
      "https://images.unsplash.com/photo-1587145820266-a5951ee6f620?auto=format&fit=crop&w=800&q=80",
    ],
    studentHandle: "ananya-iyer",
  },

  // ================= FURNITURE =================
  {
    category: "furniture",
    title: "Ergonomic Mesh Study Chair with Lumbar Support",
    description: "Breathable high-back mesh chair with adjustable seat height, 360-degree swivel, and tilt tension lock. Soft padded armrests. Extremely comfortable for late-night study sessions in the hostel. Clean, no tears or wobbles. Moving out so selling cheap.",
    price: 1950,
    listingType: "sale",
    condition: "good",
    location: "Hostel 5 Room 312, Main Campus",
    tags: ["chair", "studychair", "ergonomic", "furniture", "hostel"],
    images: [
      "https://images.unsplash.com/photo-1580481077111-9a746522c069?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1505797149-43b0069ec26b?auto=format&fit=crop&w=800&q=80",
    ],
    studentHandle: "priya-patel",
  },
  {
    category: "furniture",
    title: "Foldable Wooden Laptop Study Table for Bed",
    description: "Multi-functional bed study desk with built-in tablet/book groove and cup holder. Sturdy aluminum alloy legs with anti-slip rubber pads. Folds completely flat for easy storage behind the hostel door or under the bed.",
    price: 450,
    listingType: "sale",
    condition: "like_new",
    location: "Hostel Block 1 Lobby",
    tags: ["laptoptable", "beddesk", "study", "furniture", "foldable"],
    images: [
      "https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?auto=format&fit=crop&w=800&q=80",
    ],
    studentHandle: "vikram-singh",
  },
  {
    category: "furniture",
    title: "3-Tier Engineered Wood Bookshelf & Storage Rack",
    description: "Compact white laminate bookshelf with 3 deep tiers. Fits over 40 textbooks, notebooks, and storage organizers. Very sturdy and lightweight enough for one person to carry down the hostel corridor.",
    price: 600,
    listingType: "sale",
    condition: "good",
    location: "Hostel 4 Ground Floor Entrance",
    tags: ["bookshelf", "storage", "furniture", "wood", "organizer"],
    images: [
      "https://images.unsplash.com/photo-1594026112284-02bb6f3352fe?auto=format&fit=crop&w=800&q=80",
    ],
    studentHandle: "ananya-iyer",
  },

  // ================= STATIONERY =================
  {
    category: "stationery",
    title: "Professional A2 Engineering Drawing Board with Parallel Motion Bar",
    description: "Standard 810x580mm wooden drawing board with smooth melamine finish and attached parallel ruler motion bar. Essential for first-year Engineering Graphics (EG) coursework. Board surface is completely smooth without cuts or dents. Includes board cover bag.",
    price: 750,
    listingType: "sale",
    condition: "good",
    location: "Mechanical Department Graphics Lab",
    tags: ["drawingboard", "engineeringgraphics", "stationery", "drafting"],
    images: [
      "https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1585336261026-4076f823f95e?auto=format&fit=crop&w=800&q=80",
    ],
    studentHandle: "priya-patel",
  },
  {
    category: "stationery",
    title: "Rotring Professional Mini Drafter with Clamp & Scale",
    description: "High-precision engineering mini-drafter with steel arm rods and clear acrylic 360-degree protractor head. Clamps securely onto any desk or drawing board. Cleaned and lubricated; moves smoothly without slack.",
    price: 450,
    listingType: "sale",
    condition: "like_new",
    location: "Civil Engineering Workshop, East Campus",
    tags: ["minidrafter", "rotring", "engineering", "drafting", "stationery"],
    images: [
      "https://images.unsplash.com/photo-1585336261026-4076f823f95e?auto=format&fit=crop&w=800&q=80",
    ],
    studentHandle: "vikram-singh",
  },
  {
    category: "stationery",
    title: "Staedtler Technical Pens & Drawing Compass Kit",
    description: "Want to exchange a complete drawing instrument box (large bow compass, extension bar, technical pen adapters) for a pack of 500 A4 printer paper reams or sticky notes bundle. All compass joints are tight and precise.",
    price: 0,
    listingType: "exchange",
    exchangeFor: "Pack of 500 sheets 75 GSM A4 copy paper + highlighter set",
    condition: "good",
    location: "Architecture Studios, North Campus",
    tags: ["staedtler", "compass", "drawingkit", "exchange", "stationery"],
    images: [
      "https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?auto=format&fit=crop&w=800&q=80",
    ],
    studentHandle: "ananya-iyer",
  },

  // ================= CYCLES & TRANSPORT =================
  {
    category: "cycles",
    title: "Hero Sprint Pro 21-Speed Mountain Bicycle",
    description: "26-inch matte black MTB with dual disc brakes, Shimano 21-speed thumb shifters, and front suspension fork. Ideal for commuting across campus between hostel and academic blocks. Serviced last month: brand new rear brake pads and lubricated chain. Includes kickstand and bell.",
    price: 3600,
    listingType: "sale",
    condition: "good",
    location: "Hostel 3 Cycle Parking Bay",
    tags: ["bicycle", "herosprint", "cycle", "shimano", "transport"],
    images: [
      "https://images.unsplash.com/photo-1485965120184-e220f721d03e?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1532298229144-0ec0c57515c7?auto=format&fit=crop&w=800&q=80",
    ],
    studentHandle: "aarav-sharma",
  },
  {
    category: "cycles",
    title: "Btwin Single Speed Campus Commuter Cycle",
    description: "Minimalist Decathlon city cycle. Zero gear maintenance hassle, puncture-resistant tires, front basket for carrying backpack or grocery bags, and comfortable wide saddle. Quick and reliable transport for daily lectures.",
    price: 2200,
    listingType: "sale",
    condition: "good",
    location: "Sports Ground Cycle Stand",
    tags: ["btwin", "decathlon", "cycle", "commuter", "campus"],
    images: [
      "https://images.unsplash.com/photo-1532298229144-0ec0c57515c7?auto=format&fit=crop&w=800&q=80",
    ],
    studentHandle: "priya-patel",
  },
  {
    category: "cycles",
    title: "Decathlon Cycling Helmet + Heavy-Duty Number Cable Lock",
    description: "Medium size ventilated cycling helmet (certified impact protection) along with a 4-digit resettable combination steel cable lock (1.2m long). Perfect safety bundle for campus riders. Handing over in original packaging.",
    price: 550,
    listingType: "sale",
    condition: "like_new",
    location: "Hostel 6 Security Desk",
    tags: ["helmet", "cyclelock", "decathlon", "safety", "accessories"],
    images: [
      "https://images.unsplash.com/photo-1559348349-86f1f65817fe?auto=format&fit=crop&w=800&q=80",
    ],
    studentHandle: "vikram-singh",
  },

  // ================= HOSTEL ESSENTIALS =================
  {
    category: "hostel",
    title: "Pigeon 1.5L Stainless Steel Electric Kettle",
    description: "1500W rapid boil electric kettle with automatic shut-off and boil-dry protection. Clean brushed stainless steel interior with zero mineral scaling. Lifesaver in the hostel for midnight noodles, hot water, tea, and coffee.",
    price: 450,
    listingType: "sale",
    condition: "like_new",
    location: "Hostel Block 4 Pantry Area",
    tags: ["kettle", "electrickettle", "pigeon", "hostel", "appliances"],
    images: [
      "https://images.unsplash.com/photo-1576402187878-974f70c890a5?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1594213114663-ddf4f240f08d?auto=format&fit=crop&w=800&q=80",
    ],
    studentHandle: "rohan-mehta",
  },
  {
    category: "hostel",
    title: "Rechargeable LED Desk Study Lamp with 3 Color Modes",
    description: "Flexible gooseneck study lamp with touch dimmer control (warm, natural, cool white light modes). Built-in 2000mAh battery provides 6+ hours of backup during hostel power cuts. Micro-USB charging cable included.",
    price: 350,
    listingType: "sale",
    condition: "like_new",
    location: "Hostel 1 Common Room",
    tags: ["studylamp", "ledlamp", "hostellife", "rechargeable", "reading"],
    images: [
      "https://images.unsplash.com/photo-1534972195531-a756b1126f24?auto=format&fit=crop&w=800&q=80",
    ],
    studentHandle: "neha-gupta",
  },
  {
    category: "hostel",
    title: "Hostel Room Plastic Bucket, Mug & Clothes Drying Rack",
    description: "20L heavy duty plastic bucket, matching mug, and a lightweight foldable clothes drying stand. Clean and intact. Moving out of the hostel so giving away this starter kit to any freshman for free!",
    price: 0,
    listingType: "free",
    condition: "good",
    location: "Hostel 5 Corridor 2nd Floor",
    tags: ["bucket", "dryingrack", "hostelstarter", "free", "essentials"],
    images: [
      "https://images.unsplash.com/photo-1584132967334-10e028bd69f7?auto=format&fit=crop&w=800&q=80",
    ],
    studentHandle: "priya-patel",
  },

  // ================= CLOTHING =================
  {
    category: "clothing",
    title: "University White Lab Coat (Size M, 100% Cotton)",
    description: "Standard full-sleeve laboratory coat with front pocket and side slits. Required for Chemistry, Biology, and Manufacturing workshop labs. Washed, ironed, and spotless with no chemical stains or tears.",
    price: 250,
    listingType: "sale",
    condition: "like_new",
    location: "Chemistry Lab Complex Main Entrance",
    tags: ["labcoat", "whitecoat", "cotton", "chemistrylab", "clothing"],
    images: [
      "https://images.unsplash.com/photo-1584820927498-cfe5211fd8bf?auto=format&fit=crop&w=800&q=80",
    ],
    studentHandle: "neha-gupta",
  },
  {
    category: "clothing",
    title: "Waterproof Windcheater Rain Jacket (Navy Blue, Size L)",
    description: "Lightweight breathable rain jacket with adjustable hood and zippered pockets. Packs into its own pouch. Great for riding your cycle across campus during monsoons. Kept in pristine condition.",
    price: 650,
    listingType: "sale",
    condition: "like_new",
    location: "Main Gymnasium Porch",
    tags: ["jacket", "raincoat", "windcheater", "waterproof", "monsoon"],
    images: [
      "https://images.unsplash.com/photo-1548883354-7622d03aca27?auto=format&fit=crop&w=800&q=80",
    ],
    studentHandle: "vikram-singh",
  },
  {
    category: "clothing",
    title: "Official Campus Winter Hoodie (Unisex, Size M)",
    description: "Warm fleece-lined varsity college hoodie with front kangaroo pocket. Super soft, perfect for chilly winter morning lectures in the main auditorium. Looking to swap for a Size XL or selling.",
    price: 450,
    listingType: "sale",
    condition: "good",
    location: "Student Activity Center (SAC) Courtyard",
    tags: ["hoodie", "campushoodie", "winterwear", "fleece", "clothing"],
    images: [
      "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=800&q=80",
    ],
    studentHandle: "ananya-iyer",
  },

  // ================= SPORTS & FITNESS =================
  {
    category: "sports",
    title: "Yonex Carbonex 8000 Plus Badminton Racket with Full Bag",
    description: "Lightweight carbon-graphite badminton racket with G4 grip and BG65 strings tensioned at 24 lbs. Excellent control and smash power for campus indoor courts. No frame cracks or chips. Comes with Yonex thermal full racket cover.",
    price: 1100,
    listingType: "sale",
    condition: "like_new",
    location: "Indoor Sports Complex Badminton Courts",
    tags: ["yonex", "badminton", "racket", "sports", "fitness"],
    images: [
      "https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?auto=format&fit=crop&w=800&q=80",
    ],
    studentHandle: "vikram-singh",
  },
  {
    category: "sports",
    title: "Nivia Pro Carbon Synthetic Leather Football (Size 5)",
    description: "Official match weight and size 32-panel FIFA standard football. Excellent bounce and air retention with butyl bladder. Used only 3 times on the campus turf ground. Free ball inflation pin included.",
    price: 550,
    listingType: "sale",
    condition: "like_new",
    location: "Football Ground Pavilion",
    tags: ["nivia", "football", "soccer", "sports", "turf"],
    images: [
      "https://images.unsplash.com/photo-1511886929837-354d827aae26?auto=format&fit=crop&w=800&q=80",
    ],
    studentHandle: "vikram-singh",
  },
  {
    category: "sports",
    title: "Hexagonal Rubber Dumbbells Pair (5kg each)",
    description: "Pair of 5kg solid cast iron dumbbells with durable rubber hexagonal coating (won't roll away on the hostel floor) and chrome ergonomic knurled handles. Great for hostel workouts.",
    price: 800,
    listingType: "sale",
    condition: "good",
    location: "Hostel 2 Gymnasium Room",
    tags: ["dumbbells", "fitness", "workout", "weights", "gym"],
    images: [
      "https://images.unsplash.com/photo-1586401100295-7a8096fd231a?auto=format&fit=crop&w=800&q=80",
    ],
    studentHandle: "rohan-mehta",
  },

  // ================= OTHER =================
  {
    category: "other",
    title: "Wildcraft 35L Water-Resistant Laptop Backpack",
    description: "Durable campus backpack with 3 large zippered compartments, padded 15.6-inch laptop sleeve, side water bottle mesh, and ergonomic back padding with airflow channels. Heavy-duty SBS zippers and reinforced stitching.",
    price: 950,
    listingType: "sale",
    condition: "like_new",
    location: "Hostel 4 Reception Desk",
    tags: ["backpack", "wildcraft", "laptopbag", "collegebag", "accessories"],
    images: [
      "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1622560480605-d83c853bc5c3?auto=format&fit=crop&w=800&q=80",
    ],
    studentHandle: "aarav-sharma",
  },
  {
    category: "other",
    title: "Milton 1000ml Stainless Steel Vacuum Insulated Thermos Flask",
    description: "Double-walled vacuum insulated flask that keeps beverages hot or cold for up to 24 hours. Leak-proof cap, 100% food grade 304 stainless steel. Ideal for long lecture days and night study sessions.",
    price: 450,
    listingType: "sale",
    condition: "like_new",
    location: "Central Canteen Patio",
    tags: ["thermos", "milton", "waterbottle", "flask", "hostel"],
    images: [
      "https://images.unsplash.com/photo-1602143407151-7111542de6e8?auto=format&fit=crop&w=800&q=80",
    ],
    studentHandle: "neha-gupta",
  },
  {
    category: "other",
    title: "Framed Cork Notice Pinboard with 50 Colorful Pushpins",
    description: "45x60cm natural cork bulletin board with light aluminum frame and mounting hooks. Perfect for organizing class timetable, project deadlines, formula sheets, and reminders on your hostel wall.",
    price: 250,
    listingType: "sale",
    condition: "like_new",
    location: "Hostel Block 3 Ground Floor",
    tags: ["noticeboard", "pinboard", "corkboard", "roomdecor", "organization"],
    images: [
      "https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=800&q=80",
    ],
    studentHandle: "ananya-iyer",
  },
];

async function seedMarketplace() {
  console.log("Connecting to MongoDB at:", MONGODB_URI);
  await mongoose.connect(MONGODB_URI);
  const db = mongoose.connection;

  console.log("Cleaning up obsolete/test products...");
  // Remove temporary test products and old listings without real images
  await db.collection("products").deleteMany({
    $or: [
      { images: { $size: 0 } },
      { images: null },
      { "images.0": { $regex: "example\\.com" } },
      { title: { $regex: /test/i } },
      { title: { $regex: /disposable/i } },
      { title: { $regex: /^alpha s4/i } },
      { title: { $regex: /^bravo s4/i } },
      { title: { $regex: /^charlie s4/i } },
      { title: { $regex: /^delta s4/i } },
      { title: { $regex: /^echo s4/i } },
      { title: { $regex: /^foxtrot s4/i } },
      { title: { $regex: /^golf s4/i } },
      { title: { $regex: /^hotel s4/i } },
    ],
  });

  // Ensure students exist
  const studentMap = new Map();
  for (const studentData of STUDENTS) {
    let student = await db.collection("users").findOne({ handle: studentData.handle });
    if (!student) {
      const now = new Date();
      const insertRes = await db.collection("users").insertOne({
        ...studentData,
        stats: { activeListings: 0, soldCount: 0 },
        createdAt: now,
        updatedAt: now,
      });
      student = { _id: insertRes.insertedId, ...studentData };
      console.log(`Created student: ${studentData.displayName} (@${studentData.handle})`);
    } else {
      // update avatar and bio if needed
      await db.collection("users").updateOne(
        { _id: student._id },
        {
          $set: {
            avatarUrl: studentData.avatarUrl,
            bio: studentData.bio,
            department: studentData.department,
            campus: studentData.campus,
          },
        }
      );
    }
    studentMap.set(studentData.handle, student._id);
  }

  // Insert or update category products
  console.log("\nSeeding verified category products with high-res photos and rich descriptions...");
  let insertedCount = 0;
  let updatedCount = 0;

  for (const item of PRODUCTS_DATA) {
    const sellerId = studentMap.get(item.studentHandle) || Array.from(studentMap.values())[0];
    const existing = await db.collection("products").findOne({ title: item.title });

    const now = new Date();
    const doc = {
      seller: sellerId,
      title: item.title,
      description: item.description,
      price: item.price,
      listingType: item.listingType,
      category: item.category,
      condition: item.condition,
      images: item.images,
      location: item.location,
      exchangeFor: item.exchangeFor,
      tags: item.tags,
      status: "available",
      viewCount: Math.floor(Math.random() * 85) + 12,
      reservedFor: null,
      reservedAt: null,
      soldTo: null,
      soldAt: null,
      deletedAt: null,
      updatedAt: now,
    };

    if (existing) {
      await db.collection("products").updateOne(
        { _id: existing._id },
        { $set: doc }
      );
      updatedCount++;
    } else {
      doc.createdAt = now;
      await db.collection("products").insertOne(doc);
      insertedCount++;
    }
  }

  console.log(`Successfully seeded products: ${insertedCount} inserted, ${updatedCount} updated.`);

  // Recalculate stats for all users
  const allUsers = await db.collection("users").find().toArray();
  for (const user of allUsers) {
    const activeListings = await db.collection("products").countDocuments({
      seller: user._id,
      status: { $in: ["available", "reserved"] },
    });
    const soldCount = await db.collection("products").countDocuments({
      seller: user._id,
      status: "sold",
    });
    await db.collection("users").updateOne(
      { _id: user._id },
      { $set: { "stats.activeListings": activeListings, "stats.soldCount": soldCount } }
    );
  }

  const categorySummary = await db.collection("products").aggregate([
    { $match: { status: "available" } },
    { $group: { _id: "$category", count: { $sum: 1 }, withImages: { $sum: { $cond: [{ $gt: [{ $size: "$images" }, 0] }, 1, 0] } } } },
    { $sort: { _id: 1 } },
  ]).toArray();

  console.log("\n================ MARKETPLACE CATEGORY BREAKDOWN ================");
  console.table(categorySummary);

  await mongoose.disconnect();
  console.log("Seeding complete and database disconnected cleanly!");
}

seedMarketplace().catch((err) => {
  console.error("Seeding error:", err);
  process.exit(1);
});
