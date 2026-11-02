export type Neighbourhood = {
  slug: string;
  name: string;
  district: string;
  city: string;
  search: string;
  en: { summary: string; goodFor: string; nearby: string };
  fr: { summary: string; goodFor: string; nearby: string };
};

/** Editorial area guides. They hold no prices, so they do not go out of date quickly. */
export const NEIGHBOURHOODS: Neighbourhood[] = [
  {
    slug: "kimihurura",
    name: "Kimihurura",
    district: "Gasabo",
    city: "Kigali",
    search: "Kimihurura",
    en: {
      summary:
        "A central hillside with restaurants, cafés and offices close together, and plenty of furnished apartments.",
      goodFor: "Professionals and newcomers who want to walk to things",
      nearby: "Kigali Convention Centre, restaurants, embassies and offices",
    },
    fr: {
      summary:
        "Une colline centrale où restaurants, cafés et bureaux sont proches, avec de nombreux appartements meublés.",
      goodFor: "Professionnels et nouveaux arrivants qui aiment tout faire à pied",
      nearby: "Kigali Convention Centre, restaurants, ambassades et bureaux",
    },
  },
  {
    slug: "nyarutarama",
    name: "Nyarutarama",
    district: "Gasabo",
    city: "Kigali",
    search: "Nyarutarama",
    en: {
      summary:
        "A quiet, established residential area of larger houses and newer apartment buildings.",
      goodFor: "Families and long-stay residents",
      nearby: "Kigali Golf Resort, international schools, shopping",
    },
    fr: {
      summary:
        "Un quartier résidentiel calme et établi, avec de grandes maisons et des immeubles récents.",
      goodFor: "Familles et résidents de longue durée",
      nearby: "Kigali Golf Resort, écoles internationales, commerces",
    },
  },
  {
    slug: "kacyiru",
    name: "Kacyiru",
    district: "Gasabo",
    city: "Kigali",
    search: "Kacyiru",
    en: {
      summary:
        "Kigali's government and diplomatic quarter, with wide roads and easy access to the rest of the city.",
      goodFor: "Diplomats, NGO staff and civil servants",
      nearby: "Ministries, embassies, King Faisal Hospital",
    },
    fr: {
      summary:
        "Le quartier gouvernemental et diplomatique de Kigali, avec de larges avenues et un accès facile au reste de la ville.",
      goodFor: "Diplomates, personnel d'ONG et fonctionnaires",
      nearby: "Ministères, ambassades, hôpital King Faisal",
    },
  },
  {
    slug: "kiyovu",
    name: "Kiyovu",
    district: "Nyarugenge",
    city: "Kigali",
    search: "Kiyovu",
    en: {
      summary:
        "Older, leafy streets directly beside the city centre, with hotels and banks a short walk away.",
      goodFor: "People who work in town",
      nearby: "Kigali city centre, hotels, banks",
    },
    fr: {
      summary:
        "Des rues anciennes et arborées juste à côté du centre-ville, avec hôtels et banques à quelques minutes à pied.",
      goodFor: "Personnes qui travaillent en ville",
      nearby: "Centre-ville de Kigali, hôtels, banques",
    },
  },
  {
    slug: "remera",
    name: "Remera",
    district: "Gasabo",
    city: "Kigali",
    search: "Remera",
    en: {
      summary:
        "A busy, connected neighbourhood with strong transport links and a wide range of rents.",
      goodFor: "Students, young professionals and value seekers",
      nearby: "Amahoro Stadium, BK Arena, bus routes",
    },
    fr: {
      summary: "Un quartier animé et bien desservi, avec un large éventail de loyers.",
      goodFor: "Étudiants, jeunes actifs et budgets maîtrisés",
      nearby: "Stade Amahoro, BK Arena, lignes de bus",
    },
  },
  {
    slug: "kibagabaga",
    name: "Kibagabaga",
    district: "Gasabo",
    city: "Kigali",
    search: "Kibagabaga",
    en: {
      summary:
        "A residential area of family homes, popular with people who want space without leaving Kigali.",
      goodFor: "Families",
      nearby: "Kibagabaga Hospital, local markets, schools",
    },
    fr: {
      summary:
        "Un quartier résidentiel de maisons familiales, apprécié pour son espace sans quitter Kigali.",
      goodFor: "Familles",
      nearby: "Hôpital de Kibagabaga, marchés locaux, écoles",
    },
  },
  {
    slug: "kicukiro",
    name: "Kicukiro",
    district: "Kicukiro",
    city: "Kigali",
    search: "Kicukiro",
    en: {
      summary:
        "A growing southern district with quieter streets and straightforward access to the airport road.",
      goodFor: "Frequent travellers and families",
      nearby: "Kigali International Airport, Kicukiro Centre",
    },
    fr: {
      summary:
        "Un district du sud en plein essor, aux rues plus calmes et avec un accès simple à la route de l'aéroport.",
      goodFor: "Voyageurs fréquents et familles",
      nearby: "Aéroport international de Kigali, Kicukiro Centre",
    },
  },
  {
    slug: "rebero",
    name: "Rebero",
    district: "Kicukiro",
    city: "Kigali",
    search: "Rebero",
    en: {
      summary: "One of Kigali's higher hills, known for its views over the city and a calmer pace.",
      goodFor: "People who want views and quiet",
      nearby: "Hilltop viewpoints, a short drive to central Kigali",
    },
    fr: {
      summary:
        "L'une des plus hautes collines de Kigali, connue pour ses vues sur la ville et son rythme tranquille.",
      goodFor: "Amateurs de vue et de calme",
      nearby: "Points de vue, à courte distance en voiture du centre",
    },
  },
  {
    slug: "musanze",
    name: "Musanze",
    district: "Musanze",
    city: "Northern Province",
    search: "Musanze",
    en: {
      summary: "A cool highland town in the north, under the Virunga volcanoes.",
      goodFor: "Tourism and conservation workers",
      nearby: "Volcanoes National Park",
    },
    fr: {
      summary: "Une ville d'altitude fraîche dans le nord, au pied des volcans des Virunga.",
      goodFor: "Professionnels du tourisme et de la conservation",
      nearby: "Parc national des Volcans",
    },
  },
  {
    slug: "rubavu",
    name: "Rubavu",
    district: "Rubavu",
    city: "Western Province",
    search: "Rubavu",
    en: {
      summary:
        "A lakeside town on Lake Kivu, also known as Gisenyi, with a relaxed pace and a warm climate.",
      goodFor: "Remote workers and hospitality staff",
      nearby: "Lake Kivu beaches, the Goma border",
    },
    fr: {
      summary:
        "Une ville au bord du lac Kivu, aussi appelée Gisenyi, au rythme détendu et au climat doux.",
      goodFor: "Télétravailleurs et personnel de l'hôtellerie",
      nearby: "Plages du lac Kivu, frontière de Goma",
    },
  },
  {
    slug: "huye",
    name: "Huye",
    district: "Huye",
    city: "Southern Province",
    search: "Huye",
    en: {
      summary:
        "Rwanda's university town in the south, with a calm atmosphere and a strong academic community.",
      goodFor: "Students, lecturers and researchers",
      nearby: "University of Rwanda, Ethnographic Museum",
    },
    fr: {
      summary:
        "La ville universitaire du sud du Rwanda, à l'ambiance calme et à la forte communauté académique.",
      goodFor: "Étudiants, enseignants et chercheurs",
      nearby: "Université du Rwanda, Musée ethnographique",
    },
  },
];

export function neighbourhoodText(n: Neighbourhood, language?: string) {
  return language === "fr" ? n.fr : n.en;
}
