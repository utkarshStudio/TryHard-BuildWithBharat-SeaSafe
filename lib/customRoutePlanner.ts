import type { Route } from "@/lib/types";
import { seaSegment } from "@/lib/seaRoute";

type PortRegion =
  | "india_west"
  | "india_east"
  | "sri_lanka"
  | "gulf"
  | "se_asia"
  | "east_asia"
  | "europe"
  | "mediterranean"
  | "black_sea"
  | "africa_south"
  | "africa_east"
  | "africa_west"
  | "americas_east"
  | "americas_west"
  | "americas_south_east"
  | "americas_south_west"
  | "oceania_west"
  | "oceania_east";

export interface SeaPort {
  id: string;
  name: string;
  country: string;
  unlocode: string;
  position: [number, number];
  region: PortRegion;
  aliases: string[];
}

interface InlandPlace {
  id: string;
  name: string;
  country: string;
  position: [number, number];
  nearestPortId: string;
  aliases: string[];
}

interface GraphNode {
  id: string;
  label: string;
  position: [number, number];
}

interface GraphEdge {
  a: string;
  b: string;
  hazards?: string[];
  safeOnlyFor?: string[];
}

export interface EndpointResolution {
  input: string;
  name: string;
  country: string;
  isInland: boolean;
  port: SeaPort;
  landPosition?: [number, number];
}

export interface PlannedCustomRoute {
  origin: EndpointResolution;
  destination: EndpointResolution;
  chokepointId: string;
  hazardIds: string[];
  hazardZoneIds: string[];
  threatLabel: string;
  directRoute: Route;
  safeRoute: Route;
  cameraOverride: { longitude: number; latitude: number; zoom: number };
}

const KNOTS = 18;

const SEA_PORTS: SeaPort[] = [
  {
    id: "mormugao",
    name: "Mormugao Port",
    country: "India",
    unlocode: "INMRM",
    position: [73.8, 15.42],
    region: "india_west",
    aliases: ["goa", "mormugao", "marmagao", "panaji"],
  },
  {
    id: "mundra",
    name: "Mundra Port",
    country: "India",
    unlocode: "INMUN",
    position: [69.72, 22.74],
    region: "india_west",
    aliases: ["mundra", "kandla", "gujarat", "gandhidham"],
  },
  {
    id: "nhava_sheva",
    name: "Nhava Sheva Port",
    country: "India",
    unlocode: "INNSA",
    position: [72.95, 18.95],
    region: "india_west",
    aliases: ["mumbai", "bombay", "nhava sheva", "jnpt", "jawaharlal nehru"],
  },
  {
    id: "new_mangalore",
    name: "New Mangalore Port",
    country: "India",
    unlocode: "INNML",
    position: [74.83, 12.92],
    region: "india_west",
    aliases: ["mangalore", "mangaluru", "karnataka coast"],
  },
  {
    id: "kochi",
    name: "Kochi Port",
    country: "India",
    unlocode: "INCOK",
    position: [76.24, 9.97],
    region: "india_west",
    aliases: ["kochi", "cochin", "kerala"],
  },
  {
    id: "chennai",
    name: "Chennai Port",
    country: "India",
    unlocode: "INMAA",
    position: [80.3, 13.1],
    region: "india_east",
    aliases: ["chennai", "madras", "tamil nadu"],
  },
  {
    id: "visakhapatnam",
    name: "Visakhapatnam Port",
    country: "India",
    unlocode: "INVTZ",
    position: [83.3, 17.68],
    region: "india_east",
    aliases: ["visakhapatnam", "vizag", "andhra"],
  },
  {
    id: "haldia",
    name: "Haldia Dock Complex",
    country: "India",
    unlocode: "INHAL",
    position: [88.11, 22.02],
    region: "india_east",
    aliases: ["kolkata", "calcutta", "haldia", "west bengal"],
  },
  {
    id: "tuticorin",
    name: "Tuticorin Port",
    country: "India",
    unlocode: "INTUT",
    position: [78.18, 8.75],
    region: "india_east",
    aliases: ["tuticorin", "thoothukudi"],
  },
  {
    id: "colombo",
    name: "Port of Colombo",
    country: "Sri Lanka",
    unlocode: "LKCMB",
    position: [79.85, 6.92],
    region: "sri_lanka",
    aliases: ["colombo", "sri lanka"],
  },
  {
    id: "singapore",
    name: "Port of Singapore",
    country: "Singapore",
    unlocode: "SGSIN",
    position: [103.85, 1.29],
    region: "se_asia",
    aliases: ["singapore"],
  },
  {
    id: "shanghai",
    name: "Port of Shanghai",
    country: "China",
    unlocode: "CNSHA",
    position: [121.49, 31.23],
    region: "east_asia",
    aliases: ["shanghai", "yangshan"],
  },
  {
    id: "ningbo",
    name: "Ningbo-Zhoushan Port",
    country: "China",
    unlocode: "CNNGB",
    position: [121.55, 29.87],
    region: "east_asia",
    aliases: ["ningbo", "zhoushan"],
  },
  {
    id: "hong_kong",
    name: "Port of Hong Kong",
    country: "Hong Kong",
    unlocode: "HKHKG",
    position: [114.17, 22.32],
    region: "se_asia",
    aliases: ["hong kong", "hongkong"],
  },
  {
    id: "yokohama",
    name: "Port of Yokohama",
    country: "Japan",
    unlocode: "JPYOK",
    position: [139.63, 35.45],
    region: "east_asia",
    aliases: ["yokohama", "tokyo", "japan"],
  },
  {
    id: "busan",
    name: "Port of Busan",
    country: "South Korea",
    unlocode: "KRPUS",
    position: [129.07, 35.1],
    region: "east_asia",
    aliases: ["busan", "pusan", "south korea", "korea"],
  },
  {
    id: "rotterdam",
    name: "Port of Rotterdam",
    country: "Netherlands",
    unlocode: "NLRTM",
    position: [4.14, 51.95],
    region: "europe",
    aliases: ["rotterdam", "netherlands", "holland"],
  },
  {
    id: "antwerp",
    name: "Port of Antwerp-Bruges",
    country: "Belgium",
    unlocode: "BEANR",
    position: [4.4, 51.25],
    region: "europe",
    aliases: ["antwerp", "bruges", "belgium"],
  },
  {
    id: "hamburg",
    name: "Port of Hamburg",
    country: "Germany",
    unlocode: "DEHAM",
    position: [9.99, 53.54],
    region: "europe",
    aliases: ["hamburg", "germany"],
  },
  {
    id: "jebel_ali",
    name: "Jebel Ali Port",
    country: "United Arab Emirates",
    unlocode: "AEJEA",
    position: [55.03, 25.01],
    region: "gulf",
    aliases: ["dubai", "jebel ali", "uae", "united arab emirates"],
  },
  {
    id: "fujairah",
    name: "Port of Fujairah",
    country: "United Arab Emirates",
    unlocode: "AEFJR",
    position: [56.36, 25.12],
    region: "gulf",
    aliases: ["fujairah"],
  },
  {
    id: "das_island",
    name: "Das Island Terminal",
    country: "United Arab Emirates",
    unlocode: "AEDAS",
    position: [52.87, 25.15],
    region: "gulf",
    aliases: ["das island", "abu dhabi", "ruwais"],
  },
  {
    id: "cape_town",
    name: "Port of Cape Town",
    country: "South Africa",
    unlocode: "ZACPT",
    position: [18.42, -33.92],
    region: "africa_south",
    aliases: ["cape town", "capetown"],
  },
  {
    id: "durban",
    name: "Port of Durban",
    country: "South Africa",
    unlocode: "ZADUR",
    position: [31.02, -29.86],
    region: "africa_south",
    aliases: ["durban"],
  },
  {
    id: "istanbul",
    name: "Port of Istanbul",
    country: "Turkiye",
    unlocode: "TRIST",
    position: [28.97, 41.01],
    region: "black_sea",
    aliases: ["istanbul", "constantinople"],
  },
  {
    id: "odessa",
    name: "Port of Odessa",
    country: "Ukraine",
    unlocode: "UAODS",
    position: [30.73, 46.47],
    region: "black_sea",
    aliases: ["odessa", "odesa", "ukraine"],
  },
  {
    id: "new_york",
    name: "Port of New York and New Jersey",
    country: "United States",
    unlocode: "USNYC",
    position: [-74.01, 40.7],
    region: "americas_east",
    aliases: ["new york", "nyc", "new jersey"],
  },
  {
    id: "los_angeles",
    name: "Port of Los Angeles",
    country: "United States",
    unlocode: "USLAX",
    position: [-118.25, 33.74],
    region: "americas_west",
    aliases: ["los angeles", "la", "long beach"],
  },
  {
    id: "oakland",
    name: "Port of Oakland",
    country: "United States",
    unlocode: "USOAK",
    position: [-122.33, 37.8],
    region: "americas_west",
    aliases: ["san francisco", "oakland", "bay area", "silicon valley"],
  },
  {
    id: "seattle",
    name: "Port of Seattle",
    country: "United States",
    unlocode: "USSEA",
    position: [-122.34, 47.6],
    region: "americas_west",
    aliases: ["seattle", "tacoma", "pacific northwest"],
  },
  {
    id: "houston",
    name: "Port Houston",
    country: "United States",
    unlocode: "USHOU",
    position: [-95.26, 29.73],
    region: "americas_east",
    aliases: ["houston", "texas"],
  },
  {
    id: "miami",
    name: "PortMiami",
    country: "United States",
    unlocode: "USMIA",
    position: [-80.18, 25.78],
    region: "americas_east",
    aliases: ["miami", "florida"],
  },
  {
    id: "veracruz",
    name: "Port of Veracruz",
    country: "Mexico",
    unlocode: "MXVER",
    position: [-96.13, 19.2],
    region: "americas_east",
    aliases: ["veracruz", "mexico city", "cdmx", "mexico"],
  },
  {
    id: "cartagena",
    name: "Port of Cartagena",
    country: "Colombia",
    unlocode: "COCTG",
    position: [-75.53, 10.4],
    region: "americas_east",
    aliases: ["cartagena", "bogota", "medellin", "colombia"],
  },
  {
    id: "santos",
    name: "Port of Santos",
    country: "Brazil",
    unlocode: "BRSSZ",
    position: [-46.31, -23.96],
    region: "americas_south_east",
    aliases: ["santos", "sao paulo", "rio de janeiro", "brasilia", "brazil"],
  },
  {
    id: "buenos_aires",
    name: "Port of Buenos Aires",
    country: "Argentina",
    unlocode: "ARBUE",
    position: [-58.37, -34.6],
    region: "americas_south_east",
    aliases: ["buenos aires", "argentina", "montevideo", "uruguay"],
  },
  {
    id: "callao",
    name: "Port of Callao",
    country: "Peru",
    unlocode: "PECLL",
    position: [-77.15, -12.05],
    region: "americas_south_west",
    aliases: ["lima", "callao", "peru"],
  },
  {
    id: "valparaiso",
    name: "Port of Valparaiso",
    country: "Chile",
    unlocode: "CLVAP",
    position: [-71.62, -33.04],
    region: "americas_south_west",
    aliases: ["valparaiso", "santiago", "chile"],
  },
  {
    id: "felixstowe",
    name: "Port of Felixstowe",
    country: "United Kingdom",
    unlocode: "GBFXT",
    position: [1.31, 51.95],
    region: "europe",
    aliases: ["london", "felixstowe", "united kingdom", "uk", "england"],
  },
  {
    id: "le_havre",
    name: "Port of Le Havre",
    country: "France",
    unlocode: "FRLEH",
    position: [0.11, 49.49],
    region: "europe",
    aliases: ["paris", "le havre", "france"],
  },
  {
    id: "valencia",
    name: "Port of Valencia",
    country: "Spain",
    unlocode: "ESVLC",
    position: [-0.32, 39.44],
    region: "mediterranean",
    aliases: ["valencia", "madrid", "spain"],
  },
  {
    id: "barcelona",
    name: "Port of Barcelona",
    country: "Spain",
    unlocode: "ESBCN",
    position: [2.17, 41.35],
    region: "mediterranean",
    aliases: ["barcelona", "catalonia"],
  },
  {
    id: "marseille",
    name: "Port of Marseille Fos",
    country: "France",
    unlocode: "FRMRS",
    position: [5.36, 43.3],
    region: "mediterranean",
    aliases: ["marseille", "lyon", "geneva"],
  },
  {
    id: "genoa",
    name: "Port of Genoa",
    country: "Italy",
    unlocode: "ITGOA",
    position: [8.93, 44.4],
    region: "mediterranean",
    aliases: ["genoa", "milan", "zurich", "turin"],
  },
  {
    id: "piraeus",
    name: "Port of Piraeus",
    country: "Greece",
    unlocode: "GRPIR",
    position: [23.63, 37.94],
    region: "mediterranean",
    aliases: ["athens", "piraeus", "greece"],
  },
  {
    id: "alexandria",
    name: "Port of Alexandria",
    country: "Egypt",
    unlocode: "EGALY",
    position: [29.87, 31.2],
    region: "mediterranean",
    aliases: ["alexandria", "cairo", "egypt"],
  },
  {
    id: "gdansk",
    name: "Port of Gdansk",
    country: "Poland",
    unlocode: "PLGDN",
    position: [18.67, 54.4],
    region: "europe",
    aliases: ["gdansk", "warsaw", "poland"],
  },
  {
    id: "st_petersburg",
    name: "Port of Saint Petersburg",
    country: "Russia",
    unlocode: "RULED",
    position: [30.25, 59.9],
    region: "europe",
    aliases: ["saint petersburg", "st petersburg", "moscow", "russia"],
  },
  {
    id: "dammam",
    name: "King Abdulaziz Port Dammam",
    country: "Saudi Arabia",
    unlocode: "SADMM",
    position: [50.2, 26.45],
    region: "gulf",
    aliases: ["dammam", "riyadh", "saudi arabia"],
  },
  {
    id: "doha",
    name: "Hamad Port",
    country: "Qatar",
    unlocode: "QAHMD",
    position: [51.61, 24.79],
    region: "gulf",
    aliases: ["doha", "qatar", "hamad port"],
  },
  {
    id: "karachi",
    name: "Port of Karachi",
    country: "Pakistan",
    unlocode: "PKKHI",
    position: [66.98, 24.8],
    region: "india_west",
    aliases: ["karachi", "islamabad", "lahore", "pakistan"],
  },
  {
    id: "chittagong",
    name: "Port of Chittagong",
    country: "Bangladesh",
    unlocode: "BDCGP",
    position: [91.8, 22.3],
    region: "india_east",
    aliases: ["chittagong", "chattogram", "dhaka", "bangladesh"],
  },
  {
    id: "laem_chabang",
    name: "Laem Chabang Port",
    country: "Thailand",
    unlocode: "THLCH",
    position: [100.88, 13.08],
    region: "se_asia",
    aliases: ["bangkok", "laem chabang", "thailand"],
  },
  {
    id: "port_klang",
    name: "Port Klang",
    country: "Malaysia",
    unlocode: "MYPKG",
    position: [101.39, 3.0],
    region: "se_asia",
    aliases: ["kuala lumpur", "port klang", "malaysia"],
  },
  {
    id: "tanjung_priok",
    name: "Port of Tanjung Priok",
    country: "Indonesia",
    unlocode: "IDTPP",
    position: [106.88, -6.1],
    region: "se_asia",
    aliases: ["jakarta", "tanjung priok", "indonesia"],
  },
  {
    id: "manila",
    name: "Port of Manila",
    country: "Philippines",
    unlocode: "PHMNL",
    position: [120.97, 14.58],
    region: "se_asia",
    aliases: ["manila", "philippines"],
  },
  {
    id: "tianjin",
    name: "Port of Tianjin",
    country: "China",
    unlocode: "CNTXG",
    position: [117.74, 39.0],
    region: "east_asia",
    aliases: ["beijing", "tianjin", "peking"],
  },
  {
    id: "shenzhen",
    name: "Port of Shenzhen",
    country: "China",
    unlocode: "CNSZX",
    position: [113.88, 22.5],
    region: "se_asia",
    aliases: ["shenzhen", "guangzhou", "canton"],
  },
  {
    id: "kobe",
    name: "Port of Kobe",
    country: "Japan",
    unlocode: "JPUKB",
    position: [135.2, 34.68],
    region: "east_asia",
    aliases: ["osaka", "kobe", "kyoto"],
  },
  {
    id: "mombasa",
    name: "Port of Mombasa",
    country: "Kenya",
    unlocode: "KEMBA",
    position: [39.65, -4.04],
    region: "africa_east",
    aliases: ["mombasa", "nairobi", "kenya", "kampala", "uganda"],
  },
  {
    id: "djibouti",
    name: "Port of Djibouti",
    country: "Djibouti",
    unlocode: "DJJIB",
    position: [43.15, 11.6],
    region: "africa_east",
    aliases: ["djibouti", "addis ababa", "ethiopia"],
  },
  {
    id: "lagos",
    name: "Lagos Port Complex",
    country: "Nigeria",
    unlocode: "NGLOS",
    position: [3.38, 6.45],
    region: "africa_west",
    aliases: ["lagos", "abuja", "nigeria"],
  },
  {
    id: "tema",
    name: "Port of Tema",
    country: "Ghana",
    unlocode: "GHTEM",
    position: [0.02, 5.64],
    region: "africa_west",
    aliases: ["accra", "tema", "ghana"],
  },
  {
    id: "sydney",
    name: "Port Botany",
    country: "Australia",
    unlocode: "AUSYD",
    position: [151.22, -33.95],
    region: "oceania_east",
    aliases: ["sydney", "canberra", "port botany"],
  },
  {
    id: "melbourne",
    name: "Port of Melbourne",
    country: "Australia",
    unlocode: "AUMEL",
    position: [144.9, -37.84],
    region: "oceania_east",
    aliases: ["melbourne", "australia"],
  },
  {
    id: "fremantle",
    name: "Port of Fremantle",
    country: "Australia",
    unlocode: "AUFRE",
    position: [115.74, -32.05],
    region: "oceania_west",
    aliases: ["perth", "fremantle", "western australia"],
  },
  {
    id: "auckland",
    name: "Ports of Auckland",
    country: "New Zealand",
    unlocode: "NZAKL",
    position: [174.78, -36.84],
    region: "oceania_east",
    aliases: ["auckland", "wellington", "new zealand"],
  },
];

const INLAND_PLACES: InlandPlace[] = [
  {
    id: "delhi",
    name: "Delhi",
    country: "India",
    position: [77.21, 28.61],
    nearestPortId: "mundra",
    aliases: ["delhi", "new delhi", "ncr"],
  },
  {
    id: "ahmedabad",
    name: "Ahmedabad",
    country: "India",
    position: [72.57, 23.02],
    nearestPortId: "mundra",
    aliases: ["ahmedabad", "gandhinagar"],
  },
  {
    id: "jaipur",
    name: "Jaipur",
    country: "India",
    position: [75.79, 26.91],
    nearestPortId: "mundra",
    aliases: ["jaipur", "rajasthan"],
  },
  {
    id: "pune",
    name: "Pune",
    country: "India",
    position: [73.86, 18.52],
    nearestPortId: "nhava_sheva",
    aliases: ["pune"],
  },
  {
    id: "bangalore",
    name: "Bengaluru",
    country: "India",
    position: [77.59, 12.97],
    nearestPortId: "new_mangalore",
    aliases: ["bengaluru", "bangalore"],
  },
  {
    id: "hyderabad",
    name: "Hyderabad",
    country: "India",
    position: [78.49, 17.39],
    nearestPortId: "visakhapatnam",
    aliases: ["hyderabad", "telangana"],
  },
  {
    id: "nagpur",
    name: "Nagpur",
    country: "India",
    position: [79.09, 21.15],
    nearestPortId: "visakhapatnam",
    aliases: ["nagpur"],
  },
  {
    id: "lucknow",
    name: "Lucknow",
    country: "India",
    position: [80.95, 26.85],
    nearestPortId: "haldia",
    aliases: ["lucknow", "uttar pradesh"],
  },
  {
    id: "paris",
    name: "Paris",
    country: "France",
    position: [2.35, 48.86],
    nearestPortId: "le_havre",
    aliases: ["paris"],
  },
  {
    id: "london",
    name: "London",
    country: "United Kingdom",
    position: [-0.13, 51.51],
    nearestPortId: "felixstowe",
    aliases: ["london"],
  },
  {
    id: "madrid",
    name: "Madrid",
    country: "Spain",
    position: [-3.7, 40.42],
    nearestPortId: "valencia",
    aliases: ["madrid"],
  },
  {
    id: "berlin",
    name: "Berlin",
    country: "Germany",
    position: [13.4, 52.52],
    nearestPortId: "hamburg",
    aliases: ["berlin"],
  },
  {
    id: "warsaw",
    name: "Warsaw",
    country: "Poland",
    position: [21.01, 52.23],
    nearestPortId: "gdansk",
    aliases: ["warsaw"],
  },
  {
    id: "moscow",
    name: "Moscow",
    country: "Russia",
    position: [37.62, 55.75],
    nearestPortId: "st_petersburg",
    aliases: ["moscow"],
  },
  {
    id: "zurich",
    name: "Zurich",
    country: "Switzerland",
    position: [8.54, 47.38],
    nearestPortId: "genoa",
    aliases: ["zurich"],
  },
  {
    id: "riyadh",
    name: "Riyadh",
    country: "Saudi Arabia",
    position: [46.68, 24.71],
    nearestPortId: "dammam",
    aliases: ["riyadh"],
  },
  {
    id: "beijing",
    name: "Beijing",
    country: "China",
    position: [116.41, 39.9],
    nearestPortId: "tianjin",
    aliases: ["beijing", "peking"],
  },
  {
    id: "guangzhou",
    name: "Guangzhou",
    country: "China",
    position: [113.26, 23.13],
    nearestPortId: "shenzhen",
    aliases: ["guangzhou", "canton"],
  },
  {
    id: "seoul",
    name: "Seoul",
    country: "South Korea",
    position: [126.98, 37.57],
    nearestPortId: "busan",
    aliases: ["seoul"],
  },
  {
    id: "osaka",
    name: "Osaka",
    country: "Japan",
    position: [135.5, 34.69],
    nearestPortId: "kobe",
    aliases: ["osaka", "kyoto"],
  },
  {
    id: "bangkok",
    name: "Bangkok",
    country: "Thailand",
    position: [100.5, 13.76],
    nearestPortId: "laem_chabang",
    aliases: ["bangkok"],
  },
  {
    id: "kuala_lumpur",
    name: "Kuala Lumpur",
    country: "Malaysia",
    position: [101.69, 3.14],
    nearestPortId: "port_klang",
    aliases: ["kuala lumpur", "kl"],
  },
  {
    id: "jakarta",
    name: "Jakarta",
    country: "Indonesia",
    position: [106.83, -6.18],
    nearestPortId: "tanjung_priok",
    aliases: ["jakarta"],
  },
  {
    id: "cairo",
    name: "Cairo",
    country: "Egypt",
    position: [31.24, 30.04],
    nearestPortId: "alexandria",
    aliases: ["cairo"],
  },
  {
    id: "nairobi",
    name: "Nairobi",
    country: "Kenya",
    position: [36.82, -1.29],
    nearestPortId: "mombasa",
    aliases: ["nairobi"],
  },
  {
    id: "addis_ababa",
    name: "Addis Ababa",
    country: "Ethiopia",
    position: [38.76, 8.98],
    nearestPortId: "djibouti",
    aliases: ["addis ababa"],
  },
  {
    id: "johannesburg",
    name: "Johannesburg",
    country: "South Africa",
    position: [28.05, -26.2],
    nearestPortId: "durban",
    aliases: ["johannesburg", "pretoria"],
  },
  {
    id: "abuja",
    name: "Abuja",
    country: "Nigeria",
    position: [7.49, 9.08],
    nearestPortId: "lagos",
    aliases: ["abuja"],
  },
  {
    id: "mexico_city",
    name: "Mexico City",
    country: "Mexico",
    position: [-99.13, 19.43],
    nearestPortId: "veracruz",
    aliases: ["mexico city", "cdmx"],
  },
  {
    id: "bogota",
    name: "Bogota",
    country: "Colombia",
    position: [-74.07, 4.71],
    nearestPortId: "cartagena",
    aliases: ["bogota", "medellin"],
  },
  {
    id: "sao_paulo",
    name: "Sao Paulo",
    country: "Brazil",
    position: [-46.63, -23.55],
    nearestPortId: "santos",
    aliases: ["sao paulo", "rio de janeiro", "brasilia"],
  },
  {
    id: "lima",
    name: "Lima",
    country: "Peru",
    position: [-77.04, -12.05],
    nearestPortId: "callao",
    aliases: ["lima"],
  },
  {
    id: "santiago",
    name: "Santiago",
    country: "Chile",
    position: [-70.67, -33.45],
    nearestPortId: "valparaiso",
    aliases: ["santiago"],
  },
  {
    id: "toronto",
    name: "Toronto",
    country: "Canada",
    position: [-79.38, 43.65],
    nearestPortId: "new_york",
    aliases: ["toronto", "ottawa", "montreal"],
  },
  {
    id: "chicago",
    name: "Chicago",
    country: "United States",
    position: [-87.63, 41.88],
    nearestPortId: "new_york",
    aliases: ["chicago", "detroit"],
  },
  {
    id: "denver",
    name: "Denver",
    country: "United States",
    position: [-104.99, 39.74],
    nearestPortId: "los_angeles",
    aliases: ["denver", "phoenix", "las vegas"],
  },
];

const SEA_NODES: GraphNode[] = [
  { id: "arabian_west", label: "Arabian Sea west lane", position: [65, 15] },
  { id: "oman_sea", label: "Gulf of Oman", position: [58.5, 24.5] },
  { id: "hormuz_gate", label: "Strait of Hormuz", position: [56.5, 26.2] },
  { id: "gulf_inner", label: "Inner Persian Gulf", position: [52.6, 25.4] },
  { id: "gulf_aden", label: "Gulf of Aden", position: [51, 12.5] },
  { id: "bab_el_mandeb_gate", label: "Bab-el-Mandeb", position: [43.5, 12.5] },
  { id: "red_sea_mid", label: "Red Sea northbound lane", position: [38, 20] },
  { id: "suez_south", label: "Suez south approach", position: [32.5, 30] },
  { id: "port_said", label: "Port Said", position: [32.3, 31.2] },
  { id: "med_east", label: "Eastern Mediterranean", position: [20, 35] },
  { id: "gibraltar", label: "Gibraltar", position: [-5.5, 36] },
  { id: "bay_biscay", label: "Bay of Biscay", position: [-5, 45] },
  { id: "north_sea", label: "North Sea approach", position: [2, 50] },

  { id: "south_india", label: "South India coastal lane", position: [77, 6] },
  { id: "sri_lanka_south", label: "South of Sri Lanka", position: [80, 5] },
  { id: "bay_bengal", label: "Bay of Bengal", position: [88, 7] },
  { id: "malacca_west", label: "Malacca west approach", position: [99.5, 4.5] },
  { id: "singapore_anchor", label: "Singapore Strait", position: [103.85, 1.29] },
  { id: "south_china_sea", label: "South China Sea", position: [112, 12] },
  { id: "east_china_sea", label: "East China Sea", position: [122, 29] },
  { id: "japan_approach", label: "Japan approach", position: [136, 33] },
  { id: "indian_ocean_south", label: "South Indian Ocean", position: [90, -8] },
  { id: "sunda_strait", label: "Sunda Strait", position: [105.8, -6] },
  { id: "java_sea", label: "Java Sea", position: [112, -4] },
  { id: "philippine_sea", label: "Philippine Sea", position: [125, 10] },
  { id: "pacific_west", label: "Western Pacific", position: [135, 20] },
  { id: "cape_south", label: "Cape of Good Hope", position: [18.5, -34.2] },
  { id: "cape_west", label: "South Atlantic lane", position: [0, -35] },
  { id: "west_africa_south", label: "West Africa southbound lane", position: [-15, -20] },
  { id: "west_africa_mid", label: "West Africa mid-latitude lane", position: [-15, 0] },
  { id: "west_africa_north", label: "West Africa northbound lane", position: [-5, 25] },
  { id: "bosphorus", label: "Bosphorus", position: [29.1, 41.3] },
  { id: "black_sea", label: "Black Sea route", position: [31.5, 44] },
  { id: "panama_canal", label: "Panama Canal", position: [-79.6, 9.1] },
  { id: "east_africa_coast", label: "East Africa coast", position: [43, -8] },
  { id: "west_africa_gulf", label: "Gulf of Guinea", position: [0, 2] },
  { id: "south_atlantic_west", label: "South Atlantic west lane", position: [-35, -25] },
  { id: "pacific_us_west", label: "US Pacific coast lane", position: [-125, 35] },
  { id: "pacific_south_east", label: "South Pacific east lane", position: [-88, -22] },
  { id: "australia_west_approach", label: "Australia west approach", position: [110, -25] },
  { id: "australia_east_approach", label: "Australia east approach", position: [155, -25] },
];

const BASE_EDGES: GraphEdge[] = [
  { a: "arabian_west", b: "gulf_aden" },
  { a: "arabian_west", b: "oman_sea" },
  { a: "oman_sea", b: "hormuz_gate", hazards: ["hormuz"] },
  { a: "hormuz_gate", b: "gulf_inner", hazards: ["hormuz"] },
  { a: "gulf_aden", b: "bab_el_mandeb_gate", hazards: ["bab_el_mandeb"] },
  { a: "bab_el_mandeb_gate", b: "red_sea_mid", hazards: ["bab_el_mandeb"] },
  { a: "red_sea_mid", b: "suez_south", hazards: ["bab_el_mandeb"] },
  { a: "suez_south", b: "port_said" },
  { a: "port_said", b: "med_east" },
  { a: "med_east", b: "gibraltar" },
  { a: "gibraltar", b: "bay_biscay" },
  { a: "bay_biscay", b: "north_sea" },
  { a: "arabian_west", b: "south_india", hazards: ["arabian_sea_cyclone"] },
  { a: "south_india", b: "sri_lanka_south", hazards: ["arabian_sea_cyclone"] },
  { a: "sri_lanka_south", b: "bay_bengal" },
  { a: "bay_bengal", b: "malacca_west", hazards: ["malacca"] },
  { a: "malacca_west", b: "singapore_anchor", hazards: ["malacca"] },
  { a: "singapore_anchor", b: "south_china_sea" },
  { a: "south_china_sea", b: "east_china_sea", hazards: ["luzon"] },
  { a: "east_china_sea", b: "japan_approach" },
  { a: "south_india", b: "indian_ocean_south", safeOnlyFor: ["malacca", "arabian_sea_cyclone"] },
  { a: "indian_ocean_south", b: "sunda_strait", safeOnlyFor: ["malacca", "arabian_sea_cyclone"] },
  { a: "indian_ocean_south", b: "cape_south", safeOnlyFor: ["arabian_sea_cyclone", "bab_el_mandeb"] },
  { a: "sunda_strait", b: "java_sea", safeOnlyFor: ["malacca"] },
  { a: "java_sea", b: "south_china_sea", safeOnlyFor: ["malacca"] },
  { a: "java_sea", b: "philippine_sea", safeOnlyFor: ["malacca", "luzon"] },
  { a: "singapore_anchor", b: "philippine_sea", safeOnlyFor: ["luzon"] },
  { a: "philippine_sea", b: "pacific_west", safeOnlyFor: ["luzon"] },
  { a: "pacific_west", b: "east_china_sea", safeOnlyFor: ["luzon"] },
  { a: "arabian_west", b: "cape_south", safeOnlyFor: ["bab_el_mandeb"] },
  { a: "cape_south", b: "cape_west", safeOnlyFor: ["bab_el_mandeb"] },
  { a: "cape_west", b: "west_africa_south", safeOnlyFor: ["bab_el_mandeb"] },
  { a: "west_africa_south", b: "west_africa_mid", safeOnlyFor: ["bab_el_mandeb"] },
  { a: "west_africa_mid", b: "west_africa_north", safeOnlyFor: ["bab_el_mandeb"] },
  { a: "west_africa_north", b: "gibraltar", safeOnlyFor: ["bab_el_mandeb"] },
  { a: "cape_south", b: "durban", hazards: ["cape_of_good_hope"] },
  { a: "istanbul", b: "bosphorus", hazards: ["turkish_straits"] },
  { a: "bosphorus", b: "black_sea", hazards: ["turkish_straits"] },
  { a: "black_sea", b: "odessa", hazards: ["turkish_straits"] },
  { a: "new_york", b: "gibraltar" },
  { a: "los_angeles", b: "panama_canal" },
  { a: "panama_canal", b: "new_york", hazards: ["panama_canal"] },
  { a: "gulf_aden", b: "east_africa_coast" },
  { a: "south_india", b: "east_africa_coast" },
  { a: "east_africa_coast", b: "cape_south" },
  { a: "west_africa_gulf", b: "west_africa_mid" },
  { a: "west_africa_gulf", b: "west_africa_south" },
  { a: "west_africa_gulf", b: "gibraltar" },
  { a: "south_atlantic_west", b: "west_africa_south" },
  { a: "south_atlantic_west", b: "new_york" },
  { a: "south_atlantic_west", b: "panama_canal" },
  { a: "pacific_us_west", b: "los_angeles" },
  { a: "pacific_us_west", b: "panama_canal" },
  { a: "pacific_us_west", b: "pacific_south_east" },
  { a: "pacific_south_east", b: "panama_canal" },
  { a: "pacific_south_east", b: "australia_east_approach" },
  { a: "australia_west_approach", b: "indian_ocean_south" },
  { a: "australia_west_approach", b: "australia_east_approach" },
  { a: "australia_east_approach", b: "pacific_west" },
  { a: "australia_east_approach", b: "philippine_sea" },
];

const PORT_CONNECTIONS: Record<PortRegion, string[]> = {
  india_west: ["arabian_west", "south_india"],
  india_east: ["south_india", "bay_bengal"],
  sri_lanka: ["sri_lanka_south", "south_india"],
  gulf: ["gulf_inner", "oman_sea"],
  se_asia: ["singapore_anchor", "malacca_west", "south_china_sea"],
  east_asia: ["east_china_sea", "japan_approach"],
  europe: ["north_sea", "gibraltar"],
  mediterranean: ["med_east", "gibraltar"],
  black_sea: ["black_sea", "bosphorus"],
  africa_south: ["cape_south"],
  africa_east: ["east_africa_coast", "gulf_aden"],
  africa_west: ["west_africa_gulf", "gibraltar"],
  americas_east: ["new_york", "gibraltar", "panama_canal"],
  americas_west: ["los_angeles", "panama_canal", "pacific_us_west"],
  americas_south_east: ["south_atlantic_west", "west_africa_south"],
  americas_south_west: ["pacific_south_east", "panama_canal"],
  oceania_west: ["australia_west_approach", "indian_ocean_south"],
  oceania_east: ["australia_east_approach", "pacific_west"],
};

const HAZARD_PRIORITY = [
  "hormuz",
  "bab_el_mandeb",
  "malacca",
  "luzon",
  "arabian_sea_cyclone",
  "turkish_straits",
  "cape_of_good_hope",
  "panama_canal",
];

const HAZARD_LABELS: Record<string, string> = {
  bab_el_mandeb: "Red Sea / Suez",
  hormuz: "Hormuz",
  malacca: "Malacca",
  arabian_sea_cyclone: "Arabian Sea cyclone belt",
  turkish_straits: "Turkish Straits",
  luzon: "South China Sea / Luzon",
  cape_of_good_hope: "Cape of Good Hope",
  panama_canal: "Panama Canal",
};

function normalise(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function matchAlias(input: string, aliases: string[]): boolean {
  const needle = normalise(input);
  if (!needle) return false;
  return aliases.some((alias) => {
    const hay = normalise(alias);
    return hay === needle || (needle.length >= 4 && hay.includes(needle));
  });
}

function portById(id: string): SeaPort {
  const port = SEA_PORTS.find((p) => p.id === id);
  if (!port) throw new Error(`Route planner missing port "${id}"`);
  return port;
}

function resolveEndpoint(input: string): EndpointResolution {
  const raw = input.trim();
  const inland = INLAND_PLACES.find((p) =>
    matchAlias(raw, [p.name, ...p.aliases]),
  );
  if (inland) {
    const nearestPort = portById(inland.nearestPortId);
    return {
      input: raw,
      name: `${inland.name} via ${nearestPort.name}`,
      country: inland.country,
      isInland: true,
      landPosition: inland.position,
      port: nearestPort,
    };
  }

  const port = SEA_PORTS.find((p) => matchAlias(raw, [p.name, ...p.aliases]));
  if (port) {
    return {
      input: raw,
      name: port.name,
      country: port.country,
      isInland: false,
      port,
    };
  }

  throw new Error(
    `I do not have route data for "${input}". Try a major port or city such as Goa, Delhi, Shanghai, Rotterdam, London, Cairo, Sydney, Dubai, New York, or Santos.`,
  );
}

function slugify(value: string): string {
  return (
    normalise(value)
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 28) || "route"
  );
}

function haversineNm(a: [number, number], b: [number, number]): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const earthRadiusNm = 3440.065;
  const dLat = toRad(b[1] - a[1]);
  const dLon = toRad(b[0] - a[0]);
  const lat1 = toRad(a[1]);
  const lat2 = toRad(b[1]);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * earthRadiusNm * Math.asin(Math.min(1, Math.sqrt(h)));
}

function buildGraph(): { nodes: Map<string, GraphNode>; edges: GraphEdge[] } {
  const portNodes: GraphNode[] = SEA_PORTS.map((port) => ({
    id: port.id,
    label: port.name,
    position: port.position,
  }));
  const nodes = new Map<string, GraphNode>(
    [...SEA_NODES, ...portNodes].map((node) => [node.id, node]),
  );
  const edges = [...BASE_EDGES];

  for (const port of SEA_PORTS) {
    for (const seaNodeId of PORT_CONNECTIONS[port.region]) {
      edges.push({ a: port.id, b: seaNodeId });
    }
  }

  return { nodes, edges };
}

function edgeAllowed(
  edge: GraphEdge,
  mode: "direct" | "safe",
  avoidedHazards: Set<string>,
): boolean {
  if (mode === "direct") return !edge.safeOnlyFor;
  if (edge.hazards?.some((hazard) => avoidedHazards.has(hazard))) {
    return false;
  }
  if (edge.safeOnlyFor) {
    return edge.safeOnlyFor.some((hazard) => avoidedHazards.has(hazard));
  }
  return true;
}

function shortestPath(
  fromId: string,
  toId: string,
  mode: "direct" | "safe",
  avoidedHazards: string[] = [],
): string[] | null {
  const { nodes, edges } = buildGraph();
  const avoided = new Set(avoidedHazards);
  const dist = new Map<string, number>();
  const prev = new Map<string, string>();
  const unvisited = new Set(nodes.keys());

  for (const id of nodes.keys()) dist.set(id, Infinity);
  dist.set(fromId, 0);

  while (unvisited.size > 0) {
    let current: string | null = null;
    let best = Infinity;
    for (const id of unvisited) {
      const value = dist.get(id) ?? Infinity;
      if (value < best) {
        best = value;
        current = id;
      }
    }
    if (!current || best === Infinity) break;
    if (current === toId) break;

    unvisited.delete(current);
    for (const edge of edges) {
      if (!edgeAllowed(edge, mode, avoided)) continue;
      const neighbour =
        edge.a === current ? edge.b : edge.b === current ? edge.a : null;
      if (!neighbour || !unvisited.has(neighbour)) continue;

      const a = nodes.get(current);
      const b = nodes.get(neighbour);
      if (!a || !b) continue;

      const nextDist = best + haversineNm(a.position, b.position);
      if (nextDist < (dist.get(neighbour) ?? Infinity)) {
        dist.set(neighbour, nextDist);
        prev.set(neighbour, current);
      }
    }
  }

  if (fromId !== toId && !prev.has(toId)) return null;

  const path = [toId];
  let cursor = toId;
  while (cursor !== fromId) {
    const previous = prev.get(cursor);
    if (!previous) return null;
    path.unshift(previous);
    cursor = previous;
  }
  return path;
}

function hazardsForPath(path: string[]): string[] {
  const hazards = new Set<string>();
  for (let i = 0; i < path.length - 1; i += 1) {
    const matchingEdges = BASE_EDGES.filter(
      (candidate) =>
        (candidate.a === path[i] && candidate.b === path[i + 1]) ||
        (candidate.a === path[i + 1] && candidate.b === path[i]),
    );
    matchingEdges.forEach((edge) =>
      edge.hazards?.forEach((hazard) => hazards.add(hazard)),
    );
  }
  return HAZARD_PRIORITY.filter((hazard) => hazards.has(hazard));
}

function primaryHazard(hazardIds: string[]): string {
  return HAZARD_PRIORITY.find((hazard) => hazardIds.includes(hazard)) ??
    "open_ocean";
}

function labelForHazards(hazardIds: string[]): string {
  if (hazardIds.length === 0) return "open ocean";
  return hazardIds
    .map((id) => HAZARD_LABELS[id] ?? id.replace(/_/g, " "))
    .join(", ");
}

function significantNodeIds(path: string[]): Set<string> {
  const keep = new Set<string>();
  if (path.length > 0) {
    keep.add(path[0]);
    keep.add(path[path.length - 1]);
  }
  for (let i = 0; i < path.length - 1; i += 1) {
    const edge = BASE_EDGES.find(
      (candidate) =>
        (candidate.a === path[i] && candidate.b === path[i + 1]) ||
        (candidate.a === path[i + 1] && candidate.b === path[i]),
    );
    if (edge && (edge.hazards || edge.safeOnlyFor)) {
      keep.add(path[i]);
      keep.add(path[i + 1]);
    }
  }
  return keep;
}

function pointsForPath(path: string[]): [number, number][] {
  const { nodes } = buildGraph();
  // Only keep the origin/destination and nodes that anchor an actual
  // hazard/chokepoint on this path. Plain "connector" nodes in the graph
  // exist for pathfinding/hazard-tagging purposes, not because a ship
  // must physically pass through that exact point — forcing geometry
  // through them causes the sparse maritime network to take odd short-hop
  // detours. Letting searoute route directly between the meaningful
  // waypoints gives a cleaner, still land-avoiding result.
  const keep = significantNodeIds(path);
  const waypoints = path
    .filter((id) => keep.has(id))
    .map((id) => nodes.get(id)?.position)
    .filter((point): point is [number, number] => Boolean(point));

  if (waypoints.length < 2) return waypoints;

  const stitched: [number, number][] = [waypoints[0]];
  for (let i = 0; i < waypoints.length - 1; i += 1) {
    const segment = seaSegment(waypoints[i], waypoints[i + 1]);
    for (const point of segment.slice(1)) {
      stitched.push(point);
    }
  }
  return stitched;
}

function routeFromPoints(
  id: string,
  label: string,
  points: [number, number][],
  isCurrent: boolean,
): Route {
  const distanceNm = Math.max(
    1,
    Math.round(
      points.slice(1).reduce((sum, point, index) => {
        return sum + haversineNm(points[index], point);
      }, 0),
    ),
  );

  return {
    id,
    label,
    waypoints: points,
    distanceNm,
    etaHours: Math.max(1, Math.round(distanceNm / KNOTS)),
    isCurrent,
  };
}

function cameraFor(points: [number, number][]) {
  const lngs = points.map((p) => p[0]);
  const lats = points.map((p) => p[1]);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const span = Math.max(maxLng - minLng, (maxLat - minLat) * 1.6);
  const zoom =
    span > 150 ? 1.2 : span > 100 ? 1.5 : span > 70 ? 1.9 : span > 45 ? 2.3 : span > 25 ? 2.9 : span > 12 ? 3.5 : 4.4;

  return {
    longitude: (minLng + maxLng) / 2,
    latitude: (minLat + maxLat) / 2,
    zoom,
  };
}

function describeEndpoint(endpoint: EndpointResolution): string {
  if (!endpoint.isInland) return endpoint.port.name;
  return `${endpoint.input} via ${endpoint.port.name}`;
}

export function planCustomRoute(
  originInput: string,
  destinationInput: string,
): PlannedCustomRoute {
  const origin = resolveEndpoint(originInput);
  const destination = resolveEndpoint(destinationInput);

  const directPath =
    shortestPath(origin.port.id, destination.port.id, "direct") ?? [
      origin.port.id,
      destination.port.id,
    ];
  let hazardIds = hazardsForPath(directPath);
  let safePath = directPath;
  for (let attempt = 0; attempt < 4; attempt += 1) {
    const candidate =
      shortestPath(origin.port.id, destination.port.id, "safe", hazardIds) ??
      directPath;
    safePath = candidate;
    const candidateHazards = hazardsForPath(candidate);
    const newlyIntroduced = candidateHazards.filter(
      (hazard) => !hazardIds.includes(hazard),
    );
    if (newlyIntroduced.length === 0) break;
    hazardIds = [...hazardIds, ...newlyIntroduced];
  }
  const chokepointId = primaryHazard(hazardIds);

  const directPoints = pointsForPath(directPath);
  const safePoints = pointsForPath(safePath);
  const routeIdBase = `${slugify(origin.input)}-${slugify(destination.input)}`;
  const originLabel = describeEndpoint(origin);
  const destLabel = describeEndpoint(destination);
  const threatLabel = labelForHazards(hazardIds);
  const hazardSlug = hazardIds.length > 0 ? hazardIds.join("-") : "open-ocean";
  const hazardZoneIds = hazardIds.flatMap((id) => {
    switch (id) {
      case "bab_el_mandeb":
        return ["bab_el_mandeb_core", "red_sea_north", "gulf_of_aden_corridor"];
      case "hormuz":
        return ["hormuz_strait", "persian_gulf_inner"];
      case "malacca":
        return ["malacca_piracy"];
      case "arabian_sea_cyclone":
        return ["cyclone_hamoon_track", "cyclone_outer_bands"];
      case "turkish_straits":
        return ["bosphorus_congestion", "black_sea_conflict"];
      case "luzon":
        return [
          "luzon_strait_typhoon",
          "south_china_sea_dispute",
          "taiwan_strait_tension",
        ];
      case "cape_of_good_hope":
        return ["cape_storm_corridor"];
      case "panama_canal":
        return ["panama_canal_drought"];
      default:
        return [];
    }
  });
  const directRoute = routeFromPoints(
    `direct-${routeIdBase}-${slugify(hazardSlug)}`,
    hazardIds.length > 0
      ? `${originLabel} -> ${destLabel} (hazard route via ${threatLabel})`
      : `${originLabel} -> ${destLabel} (standard sea route)`,
    directPoints,
    true,
  );
  const safeRoute = routeFromPoints(
    `safe-${routeIdBase}-${slugify(hazardSlug)}`,
    hazardIds.length > 0
      ? `${originLabel} -> ${destLabel} (safe alternate avoiding ${threatLabel})`
      : `${originLabel} -> ${destLabel} (matched standard route)`,
    safePoints,
    false,
  );

  return {
    origin,
    destination,
    chokepointId,
    hazardIds,
    hazardZoneIds,
    threatLabel,
    directRoute,
    safeRoute,
    cameraOverride: cameraFor([...directPoints, ...safePoints]),
  };
}
