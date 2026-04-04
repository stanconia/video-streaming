export const SUBJECTS = [
  // Sciences & Math
  'Mathematics',
  'Physics',
  'Chemistry',
  'Biology',
  'Statistics',
  // Technology & Computing
  'Computer Science',
  'Artificial Intelligence',
  'Machine Learning',
  'Data Science',
  'Algorithms & Data Structures',
  'Web Development',
  'Mobile Development',
  'Cybersecurity',
  'Cloud Computing',
  'Software Engineering',
  // Languages
  'English',
  'French',
  'Spanish',
  'Arabic',
  'Mandarin',
  'German',
  // Business & Economics
  'Business Administration',
  'Economics',
  'Accounting',
  'Finance',
  'Marketing',
  'Entrepreneurship',
  // Humanities & Social Sciences
  'History',
  'Geography',
  'Political Science',
  'Psychology',
  'Sociology',
  'Philosophy',
  // Religious Studies
  'Christian Studies',
  'Islamic Studies',
  'Religious Studies',
  // Arts & Creative
  'Music',
  'Fine Arts',
  'Graphic Design',
  'Photography',
  'Film Studies',
  // Health & Wellness
  'Medicine',
  'Nursing',
  'Public Health',
  'Nutrition',
  // Engineering
  'Electrical Engineering',
  'Mechanical Engineering',
  'Civil Engineering',
  // Education
  'Education',
  'Special Education',
  // General
  'General Studies',
  'Test Preparation',
  'Personal Development',
  'Other',
] as const;

export type Subject = typeof SUBJECTS[number];

export const COUNTRIES_WITH_STATES: Record<string, string[]> = {
  'United States': ['Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado', 'Connecticut', 'Delaware', 'Florida', 'Georgia', 'Hawaii', 'Idaho', 'Illinois', 'Indiana', 'Iowa', 'Kansas', 'Kentucky', 'Louisiana', 'Maine', 'Maryland', 'Massachusetts', 'Michigan', 'Minnesota', 'Mississippi', 'Missouri', 'Montana', 'Nebraska', 'Nevada', 'New Hampshire', 'New Jersey', 'New Mexico', 'New York', 'North Carolina', 'North Dakota', 'Ohio', 'Oklahoma', 'Oregon', 'Pennsylvania', 'Rhode Island', 'South Carolina', 'South Dakota', 'Tennessee', 'Texas', 'Utah', 'Vermont', 'Virginia', 'Washington', 'West Virginia', 'Wisconsin', 'Wyoming'],
  'United Kingdom': ['England', 'Scotland', 'Wales', 'Northern Ireland'],
  'Canada': ['Alberta', 'British Columbia', 'Manitoba', 'New Brunswick', 'Newfoundland and Labrador', 'Nova Scotia', 'Ontario', 'Prince Edward Island', 'Quebec', 'Saskatchewan'],
  'Nigeria': ['Abia', 'Adamawa', 'Akwa Ibom', 'Anambra', 'Bauchi', 'Bayelsa', 'Benue', 'Borno', 'Cross River', 'Delta', 'Ebonyi', 'Edo', 'Ekiti', 'Enugu', 'FCT Abuja', 'Gombe', 'Imo', 'Jigawa', 'Kaduna', 'Kano', 'Katsina', 'Kebbi', 'Kogi', 'Kwara', 'Lagos', 'Nasarawa', 'Niger', 'Ogun', 'Ondo', 'Osun', 'Oyo', 'Plateau', 'Rivers', 'Sokoto', 'Taraba', 'Yobe', 'Zamfara'],
  'South Africa': ['Eastern Cape', 'Free State', 'Gauteng', 'KwaZulu-Natal', 'Limpopo', 'Mpumalanga', 'North West', 'Northern Cape', 'Western Cape'],
  'Ghana': ['Ashanti', 'Bono', 'Central', 'Eastern', 'Greater Accra', 'Northern', 'Upper East', 'Upper West', 'Volta', 'Western'],
  'Kenya': ['Central', 'Coast', 'Eastern', 'Nairobi', 'North Eastern', 'Nyanza', 'Rift Valley', 'Western'],
  'Egypt': ['Cairo', 'Alexandria', 'Giza', 'Luxor', 'Aswan', 'Dakahlia', 'Sharqia', 'Qalyubia'],
  'India': ['Andhra Pradesh', 'Bihar', 'Delhi', 'Gujarat', 'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Punjab', 'Rajasthan', 'Tamil Nadu', 'Telangana', 'Uttar Pradesh', 'West Bengal'],
  'Pakistan': ['Balochistan', 'Islamabad', 'Khyber Pakhtunkhwa', 'Punjab', 'Sindh'],
  'Bangladesh': ['Barisal', 'Chittagong', 'Dhaka', 'Khulna', 'Mymensingh', 'Rajshahi', 'Rangpur', 'Sylhet'],
  'Germany': ['Baden-Württemberg', 'Bavaria', 'Berlin', 'Brandenburg', 'Bremen', 'Hamburg', 'Hesse', 'Lower Saxony', 'North Rhine-Westphalia', 'Saxony'],
  'France': ['Île-de-France', 'Auvergne-Rhône-Alpes', 'Nouvelle-Aquitaine', 'Occitanie', 'Hauts-de-France', 'Provence-Alpes-Côte d\'Azur', 'Grand Est', 'Brittany'],
  'Australia': ['New South Wales', 'Victoria', 'Queensland', 'Western Australia', 'South Australia', 'Tasmania', 'ACT', 'Northern Territory'],
  'Brazil': ['São Paulo', 'Rio de Janeiro', 'Minas Gerais', 'Bahia', 'Paraná', 'Rio Grande do Sul', 'Pernambuco', 'Ceará'],
  'Mexico': ['Aguascalientes', 'Baja California', 'Chihuahua', 'Ciudad de México', 'Jalisco', 'Nuevo León', 'Puebla', 'Quintana Roo', 'Yucatán'],
  'Japan': ['Hokkaido', 'Tokyo', 'Osaka', 'Kanagawa', 'Aichi', 'Kyoto', 'Fukuoka', 'Hyogo'],
  'South Korea': ['Seoul', 'Busan', 'Incheon', 'Daegu', 'Gyeonggi', 'Gangwon', 'Jeju'],
  'China': ['Beijing', 'Shanghai', 'Guangdong', 'Zhejiang', 'Jiangsu', 'Sichuan', 'Hubei', 'Shandong'],
  'UAE': ['Abu Dhabi', 'Dubai', 'Sharjah', 'Ajman', 'Ras Al Khaimah', 'Fujairah', 'Umm Al Quwain'],
  'Saudi Arabia': ['Riyadh', 'Makkah', 'Madinah', 'Eastern Province', 'Asir', 'Tabuk'],
  'Turkey': ['Istanbul', 'Ankara', 'Izmir', 'Antalya', 'Bursa', 'Konya'],
  'Indonesia': ['Jakarta', 'West Java', 'East Java', 'Central Java', 'Bali', 'North Sumatra'],
  'Philippines': ['Metro Manila', 'Cebu', 'Davao', 'Calabarzon', 'Central Luzon'],
  'Singapore': ['Central', 'East', 'North', 'North-East', 'West'],
  'Malaysia': ['Kuala Lumpur', 'Selangor', 'Penang', 'Johor', 'Sabah', 'Sarawak'],
  'Thailand': ['Bangkok', 'Chiang Mai', 'Phuket', 'Chonburi', 'Nonthaburi'],
  'Vietnam': ['Ho Chi Minh City', 'Hanoi', 'Da Nang', 'Hai Phong', 'Can Tho'],
  'Russia': ['Moscow', 'Saint Petersburg', 'Novosibirsk', 'Sverdlovsk', 'Tatarstan'],
  'Italy': ['Lazio', 'Lombardy', 'Campania', 'Piedmont', 'Tuscany', 'Veneto', 'Sicily'],
  'Spain': ['Madrid', 'Catalonia', 'Andalusia', 'Valencia', 'Basque Country', 'Galicia'],
  'Netherlands': ['North Holland', 'South Holland', 'Utrecht', 'North Brabant', 'Gelderland'],
  'Sweden': ['Stockholm', 'Västra Götaland', 'Skåne', 'Uppsala'],
  'Norway': ['Oslo', 'Vestland', 'Trøndelag', 'Rogaland'],
  'Denmark': ['Capital Region', 'Central Denmark', 'North Denmark', 'Zealand', 'Southern Denmark'],
  'Ireland': ['Dublin', 'Cork', 'Galway', 'Limerick', 'Waterford'],
  'New Zealand': ['Auckland', 'Wellington', 'Canterbury', 'Waikato', 'Otago'],
  'Argentina': ['Buenos Aires', 'Córdoba', 'Santa Fe', 'Mendoza', 'Tucumán'],
  'Colombia': ['Bogotá', 'Antioquia', 'Valle del Cauca', 'Atlántico', 'Santander'],
  'Chile': ['Santiago', 'Valparaíso', 'Biobío', 'Maule'],
  'Peru': ['Lima', 'Arequipa', 'Cusco', 'La Libertad', 'Piura'],
  'Ethiopia': ['Addis Ababa', 'Amhara', 'Oromia', 'Tigray', 'SNNPR'],
  'Tanzania': ['Dar es Salaam', 'Dodoma', 'Arusha', 'Mwanza', 'Zanzibar'],
  'Uganda': ['Central', 'Eastern', 'Northern', 'Western'],
  'Rwanda': ['Kigali', 'Eastern', 'Northern', 'Southern', 'Western'],
  'Morocco': ['Casablanca-Settat', 'Rabat-Salé-Kénitra', 'Marrakech-Safi', 'Fès-Meknès', 'Tangier-Tetouan'],
  'Tunisia': ['Tunis', 'Sfax', 'Sousse', 'Nabeul', 'Kairouan'],
  'Cameroon': ['Centre', 'Littoral', 'West', 'North West', 'South West'],
  'Senegal': ['Dakar', 'Thiès', 'Saint-Louis', 'Diourbel', 'Kaolack'],
};

// Keep backward compatibility
export const COUNTRIES_WITH_CITIES = COUNTRIES_WITH_STATES;

export const COUNTRIES = Object.keys(COUNTRIES_WITH_STATES).sort();

export function getStatesForCountry(country: string): string[] {
  return COUNTRIES_WITH_STATES[country] || [];
}

export function getCitiesForCountry(country: string): string[] {
  return getStatesForCountry(country);
}
