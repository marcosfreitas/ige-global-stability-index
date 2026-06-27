export const DATA_URL =
  'https://raw.githubusercontent.com/marcosfreitas/ige-global-stability-index/main/data/ige-dataset-real.json'

export const AGGREGATE_ISOS = new Set([
  'EAP','ECA','LAC','MENA','NAM','SAS','SSA','WORLD',
])

export const REGION_ORDER = [
  'east_asia_pacific',
  'europe_central_asia',
  'latin_america_caribbean',
  'middle_east_north_africa',
  'north_america',
  'south_asia',
  'sub_saharan_africa',
  'global',
]

export const REGION_LABELS = {
  latin_america_caribbean:  'América Latina & Caribe',
  europe_central_asia:      'Europa & Ásia Central',
  north_america:            'América do Norte',
  sub_saharan_africa:       'África Subsaariana',
  middle_east_north_africa: 'Oriente Médio & N. África',
  south_asia:               'Ásia do Sul',
  east_asia_pacific:        'Leste Asiático & Pacífico',
  global:                   'Agregado Mundial',
  latam:   'América Latina',
  europa:  'Europa',
  norte:   'América do Norte',
  africa:  'África Subsaariana',
  mena:    'Oriente Médio & N. África',
  asia:    'Ásia',
}

export const CRISIS_EVENTS = {
  1973: 'Crise do Petróleo',
  1982: 'Crise da Dívida',
  1998: 'Crise Asiática/Russa',
  2001: '11 de Setembro',
  2008: 'GFC',
  2009: 'GFC',
  2020: 'COVID-19',
}

export const COUNTRY_NAMES = {
  ABW:'Aruba',AFG:'Afeganistão',AGO:'Angola',ALB:'Albânia',AND:'Andorra',
  ARE:'Emirados Árabes',ARG:'Argentina',ARM:'Armênia',ASM:'Samoa Americana',
  ATG:'Antígua e Barbuda',AUS:'Austrália',AUT:'Áustria',AZE:'Azerbaijão',
  BDI:'Burundi',BEL:'Bélgica',BEN:'Benin',BFA:'Burkina Faso',BGD:'Bangladesh',
  BGR:'Bulgária',BHR:'Bahrein',BHS:'Bahamas',BIH:'Bósnia-Herzegovina',
  BLR:'Bielorrússia',BLZ:'Belize',BMU:'Bermudas',BOL:'Bolívia',BRA:'Brasil',
  BRB:'Barbados',BRN:'Brunei',BTN:'Butão',BWA:'Botsuana',CAF:'Rep. Centro-Africana',
  CAN:'Canadá',CHE:'Suíça',CHI:'Ilhas do Canal',CHL:'Chile',CHN:'China',
  CIV:'Costa do Marfim',CMR:'Camarões',COD:'RD Congo',COG:'Congo',COL:'Colômbia',
  COM:'Comores',CPV:'Cabo Verde',CRI:'Costa Rica',CUB:'Cuba',CUW:'Curaçao',
  CYM:'Ilhas Caiman',CYP:'Chipre',CZE:'Rep. Tcheca',DEU:'Alemanha',DJI:'Djibuti',
  DMA:'Dominica',DNK:'Dinamarca',DOM:'Rep. Dominicana',DZA:'Argélia',ECU:'Equador',
  EGY:'Egito',ERI:'Eritreia',ESP:'Espanha',EST:'Estônia',ETH:'Etiópia',
  FIN:'Finlândia',FJI:'Fiji',FRA:'França',FRO:'Ilhas Faroé',FSM:'Micronésia',
  GAB:'Gabão',GBR:'Reino Unido',GEO:'Geórgia',GHA:'Gana',GIN:'Guiné',
  GMB:'Gâmbia',GNB:'Guiné-Bissau',GNQ:'Guiné Equatorial',GRC:'Grécia',
  GRD:'Granada',GRL:'Groenlândia',GTM:'Guatemala',GUM:'Guam',GUY:'Guiana',
  HKG:'Hong Kong',HND:'Honduras',HRV:'Croácia',HTI:'Haiti',HUN:'Hungria',
  IDN:'Indonésia',IMN:'Ilha de Man',IND:'Índia',IRL:'Irlanda',IRN:'Irã',
  IRQ:'Iraque',ISL:'Islândia',ISR:'Israel',ITA:'Itália',JAM:'Jamaica',
  JOR:'Jordânia',JPN:'Japão',KAZ:'Cazaquistão',KEN:'Quênia',KGZ:'Quirguistão',
  KHM:'Camboja',KIR:'Kiribati',KNA:'São Cristóvão e Névis',KOR:'Coreia do Sul',
  KWT:'Kuwait',LAO:'Laos',LBN:'Líbano',LBR:'Libéria',LBY:'Líbia',LCA:'Santa Lúcia',
  LIE:'Liechtenstein',LKA:'Sri Lanka',LSO:'Lesoto',LTU:'Lituânia',LUX:'Luxemburgo',
  LVA:'Letônia',MAC:'Macau',MAR:'Marrocos',MCO:'Mônaco',MDA:'Moldávia',
  MDG:'Madagáscar',MDV:'Maldivas',MEX:'México',MHL:'Ilhas Marshall',MKD:'Macedônia do Norte',
  MLI:'Mali',MLT:'Malta',MMR:'Mianmar',MNE:'Montenegro',MNG:'Mongólia',
  MNP:'Ilhas Marianas do Norte',MOZ:'Moçambique',MRT:'Mauritânia',MUS:'Maurícia',
  MWI:'Malawi',MYS:'Malásia',NCL:'Nova Caledônia',NER:'Níger',NGA:'Nigéria',
  NIC:'Nicarágua',NLD:'Países Baixos',NOR:'Noruega',NPL:'Nepal',NRU:'Nauru',
  NZL:'Nova Zelândia',OMN:'Omã',PAK:'Paquistão',PAN:'Panamá',PER:'Peru',
  PHL:'Filipinas',PLW:'Palau',PNG:'Papua Nova Guiné',POL:'Polônia',PRI:'Porto Rico',
  PRK:'Coreia do Norte',PRT:'Portugal',PRY:'Paraguai',PSE:'Palestina',
  PYF:'Polinésia Francesa',QAT:'Qatar',ROU:'Romênia',RUS:'Rússia',RWA:'Ruanda',
  SAU:'Arábia Saudita',SDN:'Sudão',SEN:'Senegal',SGP:'Singapura',SLB:'Ilhas Salomão',
  SLE:'Serra Leoa',SLV:'El Salvador',SMR:'San Marino',SOM:'Somália',SRB:'Sérvia',
  SSD:'Sudão do Sul',STP:'São Tomé e Príncipe',SUR:'Suriname',SVK:'Eslováquia',
  SVN:'Eslovênia',SWE:'Suécia',SWZ:'Essuatíni',SXM:'Sint Maarten',SYC:'Seychelles',
  SYR:'Síria',TCA:'Turks e Caicos',TCD:'Chade',TGO:'Togo',THA:'Tailândia',
  TJK:'Tajiquistão',TKM:'Turcomenistão',TLS:'Timor-Leste',TON:'Tonga',
  TTO:'Trinidad e Tobago',TUN:'Tunísia',TUR:'Turquia',TUV:'Tuvalu',TWN:'Taiwan',
  TZA:'Tanzânia',UGA:'Uganda',UKR:'Ucrânia',URY:'Uruguai',USA:'Estados Unidos',
  UZB:'Uzbequistão',VCT:'São Vicente e Granadinas',VEN:'Venezuela',
  VIR:'Ilhas Virgens (EUA)',VNM:'Vietnã',VUT:'Vanuatu',WSM:'Samoa',
  XKX:'Kosovo',YEM:'Iêmen',ZAF:'África do Sul',ZMB:'Zâmbia',ZWE:'Zimbábue',
}

export function countryName(iso) {
  return COUNTRY_NAMES[iso] || iso
}

export function regionLabel(r) {
  return REGION_LABELS[r] || (r ? r.replace(/_/g, ' ') : '—')
}
