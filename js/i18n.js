/* =========================================================================
   SPEAKEASY: English / French

   Ottawa is bilingual, so the site carries a language toggle in the header.

   How it works: rather than tagging every element in every page with a key,
   the dictionary below is keyed on the exact English string. On switching to
   French each text node is looked up, and its English original is kept on the
   node so switching back is exact. Anything not in the dictionary simply
   stays in English, so a missing translation is a gap, never a broken page.

   To translate more of the site, add entries to FR. Keys must match the
   rendered text exactly, whitespace collapsed.

   The chrome (header, footer, mobile menu) and the whole home page are
   covered. The interior pages are not yet, and fall back to English.
   ========================================================================= */

const FR = {
  /* ---- header, footer, chrome ---- */
  'Skip to content': 'Aller au contenu',
  'Home': 'Accueil',
  'Drinks': 'Le Bar',
  'Menu': 'Menu',
  'On Stage': 'Sur Scène',
  'Host Your Event': 'Événements Privés',
  'Reservations': 'Réservations',
  'Book': 'Réserver',
  'Book a table': 'Réserver une table',
  'Reserve a table': 'Réserver une table',
  'Call 613-241-6221': 'Appelez le 613-241-6221',
  'or call 613-241-6221': 'ou appelez le 613-241-6221',
  'Explore the menu': 'Voir le menu',
  'Open menu': 'Ouvrir le menu',
  'Instagram': 'Instagram',
  'Facebook': 'Facebook',
  '55 York Street, Ottawa · K1N 9B7': '55, rue York, Ottawa · K1N 9B7',
  '© 2022 Speakeasy Ottawa · ByWard Market · Please enjoy responsibly.':
    '© 2022 Speakeasy Ottawa · Marché By · À consommer avec modération.',
  '“ This must be the place ”': '“ Ce doit être ici ”',
  'scroll': 'défiler',
  '🔇 Sound off': '🔇 Son coupé',
  '🔊 Sound on': '🔊 Son activé',

  /* ---- home: about ---- */
  'The House Rules': 'La Maison',
  'Pull Up a': 'Prenez',
  'Seat.': 'place.',
  "Tucked into Ottawa's ByWard Market, Speakeasy is an elegant restaurant and live-music venue where the lights stay low and the night runs long.":
    'Niché dans le Marché By, le Speakeasy est un restaurant élégant et une salle de spectacle où la lumière reste tamisée et la soirée se prolonge.',
  'Internationally inspired plates, craft cocktails poured with prohibition-era swagger, live performances every evening, and a candlelit room that feels like a secret worth keeping. Pull up a chair.':
    "Des assiettes d'inspiration internationale, des cocktails d'artisan servis avec l'allure de la prohibition, un spectacle chaque soir et une salle aux chandelles qui a tout d'un secret bien gardé. Prenez place.",
  'This must be the place.': 'Ce doit être ici.',
  'Nightly': 'Chaque soir',
  'Live music from 7 PM': 'Musique live dès 19 h',
  'Signature cocktails': 'Cocktails signature',
  'ByWard Market': 'Marché By',
  'Food': 'Cuisine',
  'Live Music': 'Musique Live',
  'Comedy': 'Humour',
  'Concerts': 'Concerts',
  'Cocktails': 'Cocktails',

  /* ---- home: opening hours ---- */
  'When we are open': 'Nos heures',
  'Checking hours…': 'Vérification des heures…',
  'Kitchen and bar, six nights a week. Live music from 7 PM.':
    'Cuisine et bar, six soirs par semaine. Musique live dès 19 h.',
  'Opening hours': "Heures d'ouverture",
  'Monday': 'Lundi', 'Tuesday': 'Mardi', 'Wednesday': 'Mercredi', 'Thursday': 'Jeudi',
  'Friday': 'Vendredi', 'Saturday': 'Samedi', 'Sunday': 'Dimanche',
  'Closed': 'Fermé',
  '4 PM to 10:30 PM': '16 h à 22 h 30',
  '4 PM to Midnight': '16 h à minuit',
  'Tue to Thu, 4:00 PM to 10:30 PM · Fri and Sat, 4:00 PM to Midnight · Sun and Mon, closed':
    'Mar au jeu, 16 h à 22 h 30 · Ven et sam, 16 h à minuit · Dim et lun, fermé',

  /* ---- home: the doorman ---- */
  'At the door': 'À la porte',
  'The man in the': "L'homme au",
  'yellow suit.': 'complet jaune.',
  "Every speakeasy needs a doorman. Ours doesn't ask for a password. He just grins, holds the door, and points you down the red carpet.":
    "Tout speakeasy a son portier. Le nôtre ne demande pas de mot de passe : il sourit, tient la porte et vous indique le tapis rouge.",
  "If you spot him on York Street, you've found the right place. Say hello, get a photo, and head inside. The candles are already lit.":
    "Si vous l'apercevez rue York, vous êtes au bon endroit. Saluez-le, prenez une photo et entrez. Les chandelles sont déjà allumées.",
  'Find the door': 'Trouver la porte',
  "See what's on tonight →": "Voir la soirée →",
  'Most nights, out front · 55 York': 'Presque tous les soirs, devant · 55 York',

  /* ---- home: reviews ---- */
  'Word of mouth': 'Bouche à oreille',
  'What People Say': 'Ce Que L’On Dit',
  'on Google': 'sur Google',
  'Read our Google reviews': 'Lire nos avis Google',
  'Leave a review': 'Laisser un avis',

  /* ---- home: instagram ---- */
  'Follow along': 'Suivez-nous',
  'Nightly sets, new pours and the odd secret. Come find us.':
    'Des sets chaque soir, de nouveaux services et quelques secrets. Venez nous trouver.',
  'Follow on Instagram': 'Suivre sur Instagram',

  /* ---- interior pages: bar and kitchen ---- */
  "Careers": "Carrières",
  "Send message": "Envoyer",
  "Subscribe": "S'abonner",
  "Name": "Nom",
  "Email": "Courriel",
  "Company": "Entreprise",
  "Message": "Message",
  "Email address": "Adresse courriel",
  "The Bar": "Le Bar",
  "Ten signature cocktails, a curated cellar and cold bottled beer, poured with prohibition swagger.": "Dix cocktails signature, une cave choisie et des bières froides en bouteille, servis avec l'allure de la prohibition.",
  "Elevated Classics": "Classiques Rehaussés",
  "The canon, poured with a wink to the era.": "Les incontournables, servis avec un clin d'œil à l'époque.",
  "House Signatures": "Créations Maison",
  "Ours alone, built behind this bar.": "Les nôtres, montées derrière ce bar.",
  "Mocktails": "Sans Alcool",
  "All the sunshine, none of the proof.": "Tout le soleil, sans une goutte d'alcool.",
  "Alcohol Free": "Sans Alcool",
  "Beer & Cider": "Bières et Cidres",
  "Bubbles": "Bulles",
  "White": "Blancs",
  "Reds": "Rouges",
  "Rosé": "Rosés",
  "Juice": "Jus",
  "Pop": "Boissons gazeuses",
  "Red Bull": "Red Bull",
  "Ginger Beer": "Bière de gingembre",
  "All 16-18": "Tous 16-18",
  "All 17-24": "Tous 17-24",
  "All 8.5": "Tous 8,50",
  "5 oz / 8 oz / bottle": "5 oz / 8 oz / bouteille",
  "Everything but the spirit.": "Tout, sauf l'alcool.",
  "Ask about this week’s featured cocktail.": "Demandez le cocktail de la semaine.",
  "Prices in CAD. Wine shown as 5 oz / 8 oz / bottle. Ask your server about tonight’s features.": "Prix en dollars canadiens. Vins indiqués en 5 oz / 8 oz / bouteille. Demandez à votre serveur les suggestions du soir.",
  "Long, crisp and green over ice. The boss in a lighter suit.": "Long, vif et végétal sur glace. Le patron en complet léger.",
  "A northern take on the classic. Spirit-forward and warming.": "Une version nordique du classique. Franc en alcool et réconfortant.",
  "Tropical, tart and sunny. A little holiday in a glass.": "Tropical, acidulé et ensoleillé. De petites vacances dans un verre.",
  "Blackcurrant and ginger with a devilish kick of agave.": "Cassis et gingembre, avec un coup d'agave diabolique.",
  "Bright, floral and dangerously easy. The original hair-of-the-dog.": "Vif, floral et dangereusement facile. Le remède du lendemain original.",
  "Golden-hour aperitivo with a silky strawberry finish.": "Apéritif d'heure dorée, finale soyeuse à la fraise.",
  "Blush-pink and layered, with an almond-and-cherry heart.": "Rose pâle et tout en couches, sur un cœur d'amande et de cerise.",
  "Canadian comfort gone tall. Sweet, spiced and a little wild.": "Le réconfort canadien en version longue. Sucré, épicé et un brin sauvage.",
  "Elderflower and cucumber under a cloud of foam. Worth the wait.": "Sureau et concombre sous un nuage de mousse. Ça vaut l'attente.",
  "Our showpiece pour. Velvet-smooth, with bubbles on the side.": "Notre pièce maîtresse. Velouté, avec des bulles à côté.",
  "Tart, berry-dark and softly foamed.": "Acidulé, sombre comme les petits fruits, doucement mousseux.",
  "Foamed and tropical. The star turn, spirit-free.": "Mousseux et tropical. La vedette, sans alcool.",
  "Long, cold and unmistakably Canadian.": "Long, froid et résolument canadien.",
  "Rye · simple syrup · lime · cucumber-basil · ginger beer": "Rye · sirop simple · lime · concombre-basilic · bière de gingembre",
  "Rye · Grand Marnier · maple syrup · orange bitters": "Rye · Grand Marnier · sirop d'érable · amers à l'orange",
  "Passion fruit nectar · tequila · triple sec · lime": "Nectar de fruit de la passion · tequila · triple sec · lime",
  "Gin · Aperol · lime · strawberry syrup · egg white": "Gin · Aperol · lime · sirop de fraise · blanc d’œuf",
  "Tequila · cassis · simple syrup · lime · ginger beer": "Tequila · cassis · sirop simple · lime · bière de gingembre",
  "St. Germain · gin · triple sec · simple syrup · lemon": "St. Germain · gin · triple sec · sirop simple · citron",
  "White rum · apple · maple syrup · lemon · ginger beer": "Rhum blanc · pomme · sirop d'érable · citron · bière de gingembre",
  "Apple · maple syrup · lemon · ginger beer": "Pomme · sirop d'érable · citron · bière de gingembre",
  "Apple · passion fruit purée · lime · egg white": "Pomme · purée de fruit de la passion · lime · blanc d’œuf",
  "Cranberry · blackcurrant · lime · apple · lemon · egg white": "Canneberge · cassis · lime · pomme · citron · blanc d’œuf",
  "Orange · apple · passion fruit purée · vanilla · lime · soda water": "Orange · pomme · purée de fruit de la passion · vanille · lime · soda",
  "Vodka · amaretto · Luxardo · lime · cranberry · guava nectar · bitters": "Vodka · amaretto · Luxardo · lime · canneberge · nectar de goyave · amers",
  "St. Germain · gin · triple sec · simple syrup · egg white · lime · cucumber-basil": "St. Germain · gin · triple sec · sirop simple · blanc d’œuf · lime · concombre-basilic",
  "Vanilla vodka · passion fruit purée & juice · lime · egg white · side of prosecco": "Vodka vanille · purée et jus de fruit de la passion · lime · blanc d’œuf · prosecco à côté",
  "· bright & zingy": "· vif et pétillant",
  "· Champagne, France": "· Champagne, France",
  "· medium body, citrus, berry": "· corps moyen, agrumes, petits fruits",
  "· dry, red fruit, earthy oak": "· sec, fruits rouges, chêne terreux",
  "· mature, apple, citrus, vibrant": "· mûr, pomme, agrumes, vibrant",
  "· classic, crisp, fresh yellow fruit": "· classique, vif, fruits jaunes frais",
  "· NV · slightly sparkling, dark fruit": "· sans millésime · légèrement pétillant, fruits noirs",
  "· vanilla oak, red fruit, blackcurrant": "· chêne vanillé, fruits rouges, cassis",
  "· Italy · medium bodied, fresh cherries": "· Italie · corps moyen, cerises fraîches",
  "· Spain · delicate red fruits, refreshing": "· Espagne · fruits rouges délicats, rafraîchissant",
  "· Portugal · medium bodied, easy drinking": "· Portugal · corps moyen, facile à boire",
  "· Montefalco · pear, apple, citrus, mineral": "· Montefalco · poire, pomme, agrumes, minéral",
  "· Châteauneuf-du-Pape · full-bodied, elegant": "· Châteauneuf-du-Pape · corsé, élégant",
  "· Lombardy, Italy · NV · smooth foam, brioche": "· Lombardie, Italie · sans millésime · mousse soyeuse, brioche",
  "· Abruzzo, Italy · tobacco, cacao, dark fruit": "· Abruzzes, Italie · tabac, cacao, fruits noirs",
  "· Sonoma Coast · black cherries, subtle spice": "· Sonoma Coast · cerises noires, épices subtiles",
  "· Bouzy, France · NV · fine bubbles, structured": "· Bouzy, France · sans millésime · bulles fines, structuré",
  "· 100 Hill · organic, apple, grapefruit, mandarin": "· 100 Hill · biologique, pomme, pamplemousse, mandarine",
  "· Puligny-Montrachet Chardonnay · rich minerality": "· Puligny-Montrachet Chardonnay · belle minéralité",
  "· Treviso, Italy · strawberry, red berries · 6 oz pour": "· Trévise, Italie · fraise, petits fruits rouges · service 6 oz",
  "· Piedmont, Italy · elegant, fine tannins, red berries": "· Piémont, Italie · élégant, tanins fins, fruits rouges",
  "· Treviso, Italy · NV · elegant bubbles, crisp · 6 oz pour": "· Trévise, Italie · sans millésime · bulles élégantes, vif · service 6 oz",
  "Kitchen": "Cuisine",
  "The Menu": "Le Menu",
  "Small plates made for sharing, entrées worth the trip, and a sweet secret to finish. Toggle between the three.": "Des petites assiettes à partager, des plats qui valent le déplacement et un secret sucré pour finir. Passez de l’une à l’autre.",
  "Shareables": "À Partager",
  "Chef Plates": "Plats du Chef",
  "Sweets": "Douceurs",
  "From the Sea": "De la Mer",
  "From the Earth": "De la Terre",
  "From the Garden": "Du Jardin",
  "Sweet Endings": "Fins Sucrées",
  "A Taste of the Evening": "Un Avant-goût de la Soirée",
  "House favourite": "Favori de la maison",
  "Vegetarian.": "Végétarien.",
  "Live music. Tapas. Atmosphere.": "Musique live. Tapas. Ambiance.",
  "The last secret of the night.": "Le dernier secret de la soirée.",
  "Dinner served": "Service du souper",
  "Tue to Thu, 4:00 to 10:30 PM": "Mar au jeu, 16 h à 22 h 30",
  "Fri and Sat, 4:00 PM to Midnight": "Ven et sam, 16 h à minuit",
  "Market Oysters": "Huîtres du marché",
  "Tuna Tartare": "Tartare de thon",
  "Seared Scallops": "Pétoncles poêlés",
  "Gambas al Ajillo": "Gambas al ajillo",
  "Atlantic Salmon": "Saumon de l’Atlantique",
  "Beef Tataki": "Tataki de bœuf",
  "Speakeasy Sliders": "Mini-burgers Speakeasy",
  "Duck Confit": "Confit de canard",
  "Duck Confit Spring Rolls": "Rouleaux impériaux au confit de canard",
  "Rigatoni Bolognese": "Rigatonis à la bolognaise",
  "Herb Infused NY Striploin": "Contre-filet aux herbes",
  "Sous Vide Peri Peri Chicken": "Poulet peri peri sous vide",
  "Eggplant Cannelloni": "Cannellonis à l’aubergine",
  "Honey Halloumi": "Halloumi au miel",
  "Pear & Brie Crostini": "Crostinis poire et brie",
  "Papas Bravas": "Papas bravas",
  "Speakeasy Tajine Fries": "Frites tajine Speakeasy",
  "Burrata Tomato Bruschetta": "Bruschetta burrata et tomate",
  "Kale & Charred Mango Salad": "Salade de chou frisé et mangue grillée",
  "Earl Grey Crème Brûlée": "Crème brûlée Earl Grey",
  "Pecan Cheesecake": "Gâteau au fromage et pacanes",
  "Bourbon Mango Sorbet": "Sorbet mangue et bourbon",
  "Affogato": "Affogato",
  "House sauces, lemon, horseradish.": "Sauces maison, citron, raifort.",
  "Ahi tuna, avocado, sesame, citrus soy, wonton chips.": "Thon ahi, avocat, sésame, soya aux agrumes, croustilles de wonton.",
  "Flambéed U10 scallops, parsnip purée, beets, lemon, chili oil.": "Pétoncles U10 flambés, purée de panais, betteraves, citron, huile de piment.",
  "Jumbo tiger shrimp, olive oil, garlic, Thai chilli, lemon juice.": "Crevettes tigrées géantes, huile d'olive, ail, piment thaï, jus de citron.",
  "6 oz sushi grade salmon, lemon risotto, grilled vegetables, citrus glaze, mango salsa.": "Saumon qualité sushi 6 oz, risotto au citron, légumes grillés, glaçage aux agrumes, salsa à la mangue.",
  "Beef striploin, chilli ponzu, scallions.": "Contre-filet de bœuf, ponzu au piment, oignons verts.",
  "Two brioche sliders, aged cheddar, house sauce, fries.": "Deux mini-burgers sur brioche, cheddar vieilli, sauce maison, frites.",
  "8 oz breast, roasted vegetables, herbed mash.": "Poitrine de 8 oz, légumes rôtis, purée aux herbes.",
  "Asian slaw, sesame, basil, Thai chili.": "Salade de chou asiatique, sésame, basilic, piment thaï.",
  "Braised AAA beef, burrata, basil, chili.": "Bœuf AAA braisé, burrata, basilic, piment.",
  "10 oz striploin, yukon mash, market vegetables, red wine jus.": "Contre-filet de 10 oz, purée Yukon, légumes du marché, jus au vin rouge.",
  "Butter poached fingerling potatoes, kale pesto, gooseberry gastrique.": "Pommes de terre grelots pochées au beurre, pesto de chou frisé, gastrique aux groseilles.",
  "Vegetable purée, roasted sweet potato, arrabbiata sauce, basil oil.": "Purée de légumes, patate douce rôtie, sauce arrabbiata, huile de basilic.",
  "Charred halloumi, tomato, mint & honey.": "Halloumi grillé, tomate, menthe et miel.",
  "Bartlett pear, brie, honey mustard glaze, cinnamon walnut.": "Poire Bartlett, brie, glaçage miel et moutarde, noix à la cannelle.",
  "Yukon gold potatoes, in-house bravas sauce.": "Pommes de terre Yukon Gold, sauce bravas maison.",
  "Tajine spice, lemon garlic aioli.": "Épices à tajine, aïoli citron et ail.",
  "Butter toasted sourdough, basil, aged balsamic.": "Pain au levain grillé au beurre, basilic, balsamique vieilli.",
  "Pine nuts, red cabbage, parmigiano, citrus honey vinaigrette.": "Pignons, chou rouge, parmigiano, vinaigrette miel et agrumes.",
  "Bergamot-infused custard, crackling caramelised sugar.": "Crème infusée à la bergamote, sucre caramélisé craquant.",
  "Salted caramel, toasted pecan, berry gastrique.": "Caramel salé, pacanes grillées, gastrique aux petits fruits.",
  "Coconut cookie, mango bourbon, caramel.": "Biscuit à la noix de coco, mangue au bourbon, caramel.",
  "Vanilla ice cream, espresso, cookie.": "Crème glacée à la vanille, espresso, biscuit.",

  /* ---- interior pages: on stage, private events, reservations ---- */
  "Every night on the stage": "Chaque soir sur scène",
  "Events": "Événements",
  "Here's what's on.": "Voici la programmation.",
  "Live music with dinner, free to every guest. Plus ticketed nights worth crossing town for.": "De la musique live avec le souper, gratuite pour tous nos convives. Et des soirées à billets qui valent le déplacement.",
  "Worth making plans for": "À mettre à votre agenda",
  "The Main": "L'Événement",
  "Event.": "Principal.",
  "Comedy, speed dating and the nights people book ahead for. Every ticketed event is sold through Eventbrite, so your seat is confirmed before you arrive.": "Humour, rencontres express et les soirées que l'on réserve d'avance. Chaque événement à billets est vendu sur Eventbrite : votre place est confirmée avant même d'arriver.",
  "Free with dinner": "Gratuit avec le souper",
  "Live": "Musique",
  "Music.": "Live.",
  "Someone on the stage most nights during dinner service. No ticket, no cover, no list: it is free to anyone dining with us. Book a table and stay for the set.": "Quelqu'un sur scène presque tous les soirs pendant le service du souper. Sans billet, sans frais d'entrée, sans liste : c'est gratuit pour toute personne qui soupe avec nous. Réservez une table et restez pour le spectacle.",
  "No ticket needed for live music. Just book a table.": "Aucun billet requis pour la musique live. Réservez simplement une table.",
  "On the stage": "Sur scène",
  "Live, Most Nights": "En direct, presque tous les soirs",
  "A taste of the room when the set starts.": "Un aperçu de la salle quand le spectacle commence.",
  "Tickets": "Billets",
  "Get tickets on Eventbrite": "Billets sur Eventbrite",
  "Add to calendar": "Ajouter au calendrier",
  "No cover": "Sans frais d'entrée",
  "Tonight": "Ce soir",
  "Coming soon": "Bientôt",
  "The line-up for this month is still being booked.": "La programmation de ce mois est encore en préparation.",
  "The line-up for this month is still being booked. Call and we will tell you what is taking shape.": "La programmation de ce mois est encore en préparation. Appelez-nous et nous vous dirons ce qui se dessine.",
  "Nothing on tonight": "Rien à l'affiche ce soir",
  "On now": "En cours",
  "Tomorrow": "Demain",
  "Call for tonight’s line-up. The stage is rarely empty.": "Appelez pour connaître la programmation du soir. La scène est rarement vide.",
  "Vocals": "Chant",
  "Piano": "Piano",
  "Saxophone": "Saxophone",
  "Saxophonist": "Saxophoniste",
  "Piano + vocals": "Piano et chant",
  "Saxophone; patio": "Saxophone; terrasse",
  "Concert & dinner experience": "Concert et souper",
  "Live jazz dinner concert": "Souper-concert jazz",
  "With Woods & Gummeson.": "Avec Woods et Gummeson.",
  "Emil Khachaturian and Alex Zlotnik play Clapton and Di Meola on acoustic guitar and piano. Doors 6 PM, performance 6:30. General admission $35, with a three-course dinner $120; VIP booth $55, with dinner $140.": "Emil Khachaturian et Alex Zlotnik interprètent Clapton et Di Meola à la guitare acoustique et au piano. Portes 18 h, spectacle 18 h 30. Admission générale 35 $, avec souper trois services 120 $; banquette VIP 55 $, avec souper 140 $.",
  "Private events · 2026": "Événements privés · 2026",
  "Live music, curated dining and the whole room to yourselves.": "Musique live, cuisine soignée et toute la salle rien que pour vous.",
  "It Starts With": "Tout Commence Par",
  "a Phone Call.": "un Appel.",
  "A phone call": "Un appel",
  "Fifteen unhurried minutes. Tell us your date and roughly how many people, and we’ll hold it while you think.": "Quinze minutes sans presse. Donnez-nous votre date et le nombre approximatif d'invités, et nous la réservons pendant votre réflexion.",
  "We build it together": "Nous bâtissons ensemble",
  "You arrive as a guest": "Vous arrivez en invité",
  "And we take it from there": "Et nous prenons le relais",
  "Enjoy your own event. We'll take care of everything else.": "Profitez de votre événement. Nous nous occupons du reste.",
  "or email us →": "ou écrivez-nous →",
  "Where your evening happens": "Où se déroule votre soirée",
  "Two Rooms,": "Deux Salles,",
  "Both Yours.": "Toutes à Vous.",
  "Take the lounge downstairs, the room above it, or both floors for a bigger night.": "Prenez le lounge en bas, la salle à l'étage, ou les deux pour une plus grande soirée.",
  "The Lounge": "Le Lounge",
  "Upstairs": "L'Étage",
  "The whole room": "Toute la salle",
  "becomes yours.": "devient la vôtre.",
  "For a private event the entire venue is yours: the stage, the bar, the kitchen and our team, with nobody else in the building.": "Pour un événement privé, tout l'établissement est à vous : la scène, le bar, la cuisine et notre équipe, sans personne d'autre dans l'immeuble.",
  "Planning a night like this shouldn't feel like a second job. We do this every week and we genuinely love it, so we'd rather carry the details than hand you a checklist. Your only job on the night is to be present with your guests.": "Organiser une telle soirée ne devrait pas être un deuxième emploi. Nous le faisons chaque semaine et nous adorons ça : nous préférons porter les détails plutôt que de vous remettre une liste. Votre seule tâche, le soir venu, est d'être présent auprès de vos invités.",
  "Seated, full table service": "Places assises, service à table complet",
  "Cocktail-style": "Format cocktail",
  "Set for dinner": "Dressée pour le souper",
  "Set for a reception": "Dressée pour une réception",
  "Upstairs is": "L'Étage",
  "yours to rent.": "à louer.",
  "Above the lounge there's a brighter room of its own: white brick, a small stage and its own sound. Rent it on its own, or take both floors for a bigger night.": "Au-dessus du lounge se trouve une salle plus lumineuse : brique blanche, petite scène et sonorisation autonome. Louez-la seule, ou prenez les deux étages pour une plus grande soirée.",
  "Private, separate from the main room": "Privée, séparée de la salle principale",
  "Stage and sound for live sets, showcases or talks": "Scène et sonorisation pour spectacles, vitrines ou conférences",
  "Standing receptions, seated dinners or workshops": "Réceptions debout, soupers assis ou ateliers",
  "Available alongside the downstairs lounge": "Disponible en complément du lounge du bas",
  "Ask about upstairs": "Informez-vous sur l'étage",
  "Hours & how to find us →": "Heures et comment nous trouver →",
  "A night we hosted, start to finish. Filmed at 55 York Street.": "Une soirée que nous avons accueillie, du début à la fin. Filmée au 55, rue York.",
  "Included in every buyout, either floor": "Compris dans toute privatisation, sur les deux étages",
  "Exclusive use of the space": "Usage exclusif des lieux",
  "A dedicated event lead": "Un responsable d'événement attitré",
  "Full kitchen, bar and service team": "Cuisine, bar et équipe de service au complet",
  "House sound and stage lighting": "Sonorisation maison et éclairage de scène",
  "Tables, seating, glassware and service ware": "Tables, sièges, verrerie et vaisselle de service",
  "Coat check": "Vestiaire",
  "Audiovisual and presenter requirements are reviewed at your site visit. Client-supplied AV is welcome with advance notice.": "Les besoins audiovisuels et de présentation sont examinés lors de votre visite. L'équipement fourni par le client est bienvenu sur préavis.",
  "Visit & Reserve": "Visite et Réservations",
  "Book on OpenTable": "Réserver sur OpenTable",
  "Or by telephone": "Ou par téléphone",
  "By phone. We hold tables for the evening and can seat walk-ins at the bar most nights.": "Par téléphone. Nous gardons des tables pour la soirée et pouvons accueillir les visiteurs sans réservation au bar presque tous les soirs.",
  "Reservations by telephone. Walk-ins welcome. Look for the red awning on York Street.": "Réservations par téléphone. Sans réservation bienvenus. Cherchez l’auvent rouge rue York.",
  "Good to Know": "Bon à Savoir",
  "Before you come": "Avant de venir",
  "Getting here": "Pour nous trouver",
  "In the heart of the ByWard Market. Street parking on York, and the Market parking garage is a two-minute walk.": "Au cœur du Marché By. Stationnement sur rue York, et le stationnement étagé du Marché est à deux minutes à pied.",
  "Large groups": "Grands groupes",
  "Six or more? Call ahead. For a private night, see": "Six personnes ou plus ? Appelez à l’avance. Pour une soirée privée, voir",
  "private events": "événements privés",
  ", including the upstairs room.": ", y compris la salle à l'étage.",
  "Dietary needs": "Restrictions alimentaires",
  "Vegetarian options on every menu. Tell us about allergies when you book and the kitchen will work around them.": "Des options végétariennes à chaque menu. Signalez-nous vos allergies lors de la réservation et la cuisine s’y adaptera.",
  "Live music": "Musique live",
  "Every night from 7 PM, no cover. Call for tonight's line-up.": "Chaque soir dès 19 h, sans frais d'entrée. Appelez pour la programmation du soir.",
  "Gift cards": "Cartes-cadeaux",
  "Available in-house, a good answer for the person who has everything.": "Offertes sur place, une bonne réponse pour la personne qui a tout.",
  "Send a note": "Écrivez-nous",
  "Questions, private-event enquiries, or just say hello.": "Questions, demandes pour un événement privé, ou simplement pour dire bonjour.",
  "Join the list": "Joignez la liste",
  "Secret shows, seasonal menus and the occasional password. No spam.": "Spectacles secrets, menus de saison et, à l’occasion, un mot de passe. Aucun pourriel.",
  "Open in Maps": "Ouvrir dans Maps",
  "55 York Street": "55, rue York",
  "55 York Street, Ottawa ·": "55, rue York, Ottawa ·",
  "Ottawa, Ontario · K1N 9B7": "Ottawa (Ontario) · K1N 9B7",
  "No planning experience required. That part is our job, and it's the part we love most.": "Aucune expérience en organisation requise. C'est notre métier, et c'est la partie que nous préférons.",
  "We're a short walk from the Shaw Centre, the Rideau Centre and the Market's principal hotels, which is why we see so many": "Nous sommes à quelques pas du Centre Shaw, du Centre Rideau et des principaux hôtels du Marché, ce qui explique le nombre de",
  "holiday parties, client appreciation evenings, conference receptions, delegation dinners, product launches and milestone birthdays.": "partys des fêtes, soirées de reconnaissance client, réceptions de congrès, soupers de délégation, lancements de produits et anniversaires marquants.",
  "Menu, timing, run of show, music, staffing: your event lead carries all of it. Walk in, greet your people, enjoy the night. That's the whole point.": "Menu, horaire, déroulement, musique, personnel : votre responsable d'événement s'occupe de tout. Entrez, accueillez vos invités, profitez de la soirée. C'est tout l'intérêt.",
  "No forms, nothing to figure out first. One easy conversation gets us aligned on your date, your people and what the night should feel like. Everything after that is ours to carry.": "Aucun formulaire, rien à démêler d'avance. Une conversation simple suffit à nous entendre sur votre date, vos invités et l'ambiance souhaitée. Tout le reste nous revient.",
  "Walk the room, hear the sound system, shape the evening around what you actually want. One clear estimate follows: packages, bar and any additions in a single total. A signed estimate and a deposit secure the date, and the deposit comes off your final bill.": "Visitez la salle, écoutez la sonorisation, façonnez la soirée selon vos envies. Une estimation claire suit : forfaits, bar et ajouts en un seul total. Une estimation signée et un dépôt confirment la date, et le dépôt est déduit de votre facture finale.",
  "btl 98": "bout. 98",
  "btl 100": "bout. 100",
  "btl 160": "bout. 160",
  "btl 180": "bout. 180",
  "btl 240": "bout. 240",
  "btl 280": "bout. 280",
  "btl 380": "bout. 380",
  "btl 750": "bout. 750",
  "Night by night": "Soir après soir",
  "Someone on the stage most nights during dinner service, free to anyone dining with us: no ticket, no cover, no list. Ticketed concerts sit on the same calendar, marked in red.": "Quelqu'un sur scène presque tous les soirs pendant le service du souper, gratuit pour toute personne qui soupe avec nous : sans billet, sans frais d'entrée, sans liste. Les concerts à billets figurent au même calendrier, en rouge.",
  "Live music needs no ticket, just a table. The nights marked in red are sold on Eventbrite.": "La musique live ne demande aucun billet, seulement une table. Les soirées en rouge sont vendues sur Eventbrite.",
  "Ticketed": "À billets",
};

/* The live open/closed badge and the hours table are composed at runtime from
   a day and a time, so there is no fixed string to key on. These rules cover
   those shapes; a 12-hour clock also becomes the 24-hour one Quebec and
   francophone Ontario expect (16 h, 22 h 30). */
const DAY_ABBR_FR = { Sun: 'dim', Mon: 'lun', Tue: 'mar', Wed: 'mer', Thu: 'jeu', Fri: 'ven', Sat: 'sam' };
const DAY_FULL_FR = { Sunday: 'dimanche', Monday: 'lundi', Tuesday: 'mardi', Wednesday: 'mercredi',
  Thursday: 'jeudi', Friday: 'vendredi', Saturday: 'samedi' };
const MON_ABBR_FR = { Jan: 'janv', Feb: 'févr', Mar: 'mars', Apr: 'avr', May: 'mai', Jun: 'juin',
  Jul: 'juill', Aug: 'août', Sep: 'sept', Oct: 'oct', Nov: 'nov', Dec: 'déc' };
const MON_FULL_FR = { January: 'janvier', February: 'février', March: 'mars', April: 'avril',
  May: 'mai', June: 'juin', July: 'juillet', August: 'août', September: 'septembre',
  October: 'octobre', November: 'novembre', December: 'décembre' };

function timeFr(t) {
  const s = String(t).trim();
  if (/^midnight$/i.test(s)) return 'minuit';
  const m = s.match(/^(\d{1,2})(?::(\d{2}))?\s*(AM|PM)$/i);
  if (!m) return s;
  let h = Number(m[1]) % 12;
  if (/pm/i.test(m[3])) h += 12;
  return m[2] ? `${h} h ${m[2]}` : `${h} h`;
}

/* The events board composes its own strings from a date, so there is no fixed
   key to look up: "Sun · Sep 27 · 6 PM", "10 nights on the stage in September",
   "Next up · In 3 weeks". These rules translate those shapes, and the
   MutationObserver below catches the board when it repaints on a month change. */
const PATTERNS = [
  [/^Open now · until (.+)$/i, (m) => `Ouvert · jusqu'à ${timeFr(m[1])}`],
  /* --- the events board --- */
  // "Sun · Sep 27 · 6 PM"
  [/^(\w{3}) · (\w{3}) (\d{1,2}) · (.+)$/,
    (m) => `${DAY_ABBR_FR[m[1]] || m[1]} · ${m[3]} ${MON_ABBR_FR[m[2]] || m[2]} · ${timeFr(m[4])}`],
  // "Tonight · Sunday 6 Sep"
  [/^Tonight · (\w+) (\d{1,2}) (\w{3})$/,
    (m) => `Ce soir · ${DAY_FULL_FR[m[1]] || m[1]} ${m[2]} ${MON_ABBR_FR[m[3]] || m[3]}`],
  // "Fri 18 Sep · 2 sets on the stage"
  [/^(\w{3}) (\d{1,2}) (\w{3}) · (\d+) sets? on the stage$/,
    (m) => `${DAY_ABBR_FR[m[1]] || m[1]} ${m[2]} ${MON_ABBR_FR[m[3]] || m[3]} · ${m[4]} spectacle${Number(m[4]) > 1 ? 's' : ''} sur scène`],
  // "Sun 4 Oct"
  [/^(\w{3}) (\d{1,2}) (\w{3})$/,
    (m) => `${DAY_ABBR_FR[m[1]] || m[1]} ${m[2]} ${MON_ABBR_FR[m[3]] || m[3]}`],
  // "10 nights on the stage in September"
  [/^(\d+) nights? on the stage in (\w+)$/,
    (m) => `${m[1]} soir${Number(m[1]) > 1 ? 's' : ''} sur scène en ${MON_FULL_FR[m[2]] || m[2].toLowerCase()}`],
  // "September 2026" and "October · coming soon"
  [/^(\w+) (\d{4})$/, (m) => (MON_FULL_FR[m[1]] ? `${MON_FULL_FR[m[1]]} ${m[2]}` : undefined)],
  [/^(\w+) · coming soon$/, (m) => `${MON_FULL_FR[m[1]] || m[1].toLowerCase()} · bientôt`],
  // "Next up · In 3 weeks" / "· Tonight" / "· Tomorrow" / "· In 5 days" / "· On now"
  [/^Next up · In (\d+) (day|days|week|weeks)$/,
    (m) => `À venir · dans ${m[1]} ${/week/.test(m[2]) ? (Number(m[1]) > 1 ? 'semaines' : 'semaine') : 'jours'}`],
  [/^Next up · Tonight$/, () => 'À venir · ce soir'],
  [/^Next up · Tomorrow$/, () => 'À venir · demain'],
  [/^Next up · On now$/, () => 'À venir · en cours'],
  // "Next up: Martin Leblanc, 7 PM"
  [/^Next up: (.+), (\d{1,2}(?::\d{2})?\s*(?:AM|PM))$/i, (m) => `À venir : ${m[1]}, ${timeFr(m[2])}`],
  // "From $35" / "From $33.28"
  [/^From \$([\d.,]+)$/, (m) => `À partir de ${m[1].replace('.', ',')} $`],
  // a bare clock time, as the set-time chips carry
  [/^(\d{1,2}(?::\d{2})?\s*(?:AM|PM))$/i, (m) => timeFr(m[1])],
  // bare day and month abbreviations in the date blocks
  [/^(Sun|Mon|Tue|Wed|Thu|Fri|Sat)$/, (m) => DAY_ABBR_FR[m[1]]],
  [/^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)$/, (m) => MON_ABBR_FR[m[1]]],
  [/^Closed · opens today (.+)$/i, (m) => `Fermé · ouvre aujourd'hui à ${timeFr(m[1])}`],
  [/^Closed · opens (\w{3}) (.+)$/i, (m) => `Fermé · ouvre ${DAY_ABBR_FR[m[1]] || m[1]} à ${timeFr(m[2])}`],
  [/^(\d{1,2}(?::\d{2})?\s*(?:AM|PM)) to (midnight|\d{1,2}(?::\d{2})?\s*(?:AM|PM))$/i,
    (m) => `${timeFr(m[1])} à ${timeFr(m[2])}`],
];

function fromPattern(key) {
  for (const [re, fn] of PATTERNS) {
    const m = key.match(re);
    if (!m) continue;
    const fr = fn(m);
    if (fr !== undefined) return fr;   // a rule may match the shape but decline
  }
  return undefined;
}

/* Attributes worth translating as well as text. */
const ATTRS = ['aria-label', 'placeholder', 'title'];

/* Keys are matched on normalised text: whitespace collapsed, and curly quotes
   folded to straight ones. The HTML and the dictionary disagreed on apostrophes
   often enough ("we'll" against "we’ll") that half a dozen paragraphs silently
   stayed in English. Fold both sides and the class of bug goes away. */
const norm = (s) => s
  .replace(/[\u2018\u2019\u02BC]/g, "'")
  .replace(/[\u201C\u201D]/g, '"')
  .replace(/\s+/g, ' ')
  .trim();

/** The dictionary, re-keyed the same way, so lookups cannot miss on a quote. */
const FR_NORM = new Map(Object.entries(FR).map(([k, v]) => [norm(k), v]));

function translateNode(node, toFr) {
  const raw = node.textContent;
  const key = norm(raw);
  if (!key) return;
  if (toFr) {
    const fr = FR_NORM.get(key) ?? fromPattern(key);
    if (!fr) return;
    if (node.__en === undefined) node.__en = raw;
    // The key is normalised, so it may not appear verbatim inside raw. Keep the
    // node's own leading and trailing whitespace and swap the words themselves.
    const lead = raw.match(/^\s*/)[0];
    const tail = raw.match(/\s*$/)[0];
    node.textContent = lead + fr + tail;
  } else if (node.__en !== undefined) {
    node.textContent = node.__en;
    delete node.__en;
  }
}

function walk(root, toFr) {
  const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode: (n) => (n.parentNode && /^(SCRIPT|STYLE)$/.test(n.parentNode.nodeName)
      ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT),
  });
  const nodes = [];
  let n; while ((n = w.nextNode())) nodes.push(n);
  nodes.forEach((node) => translateNode(node, toFr));

  const els = root.nodeType === 1 ? [root, ...root.querySelectorAll('*')] : [...root.querySelectorAll('*')];
  els.forEach((el) => {
    if (el.nodeType !== 1) return;
    ATTRS.forEach((a) => {
      const cur = el.getAttribute(a);
      if (cur === null) return;
      const store = `__en_${a}`;
      if (toFr) {
        const fr = FR_NORM.get(norm(cur));
        if (!fr) return;
        if (el[store] === undefined) el[store] = cur;
        el.setAttribute(a, fr);
      } else if (el[store] !== undefined) {
        el.setAttribute(a, el[store]);
        delete el[store];
      }
    });
  });
}

let current = 'en';

export function applyLang(lang, root = document.body) {
  walk(root, lang === 'fr');
}

function setLang(lang) {
  current = lang === 'fr' ? 'fr' : 'en';
  document.documentElement.lang = current === 'fr' ? 'fr-CA' : 'en';
  try { localStorage.setItem('speakeasy-lang', current); } catch { /* private mode */ }
  applyLang(current);
  document.querySelectorAll('.lang__opt').forEach((b) => {
    const on = b.dataset.lang === current;
    b.classList.toggle('is-on', on);
    b.setAttribute('aria-pressed', String(on));
  });
}

export function initLang() {
  let saved = 'en';
  try { saved = localStorage.getItem('speakeasy-lang') || 'en'; } catch { /* private mode */ }
  setLang(saved);

  document.addEventListener('click', (e) => {
    const btn = e.target.closest('.lang__opt');
    if (btn) setLang(btn.dataset.lang);
  });

  // The events board renders after load, so translate what arrives later too.
  new MutationObserver((records) => {
    if (current !== 'fr') return;
    records.forEach((r) => r.addedNodes.forEach((n) => {
      if (n.nodeType === 1) applyLang('fr', n);
      else if (n.nodeType === 3) translateNode(n, true);
    }));
  }).observe(document.body, { childList: true, subtree: true });
}
