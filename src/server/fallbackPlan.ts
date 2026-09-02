/** Shared offline / Vercel fallback proposal generator. */

// Fallback high-fidelity data generator
export function getFallbackPlan(input: any): any {
  const isLocal = input.eventType === 'local';
  const location = input.locationName || (isLocal ? "Nirvana Coastal Resort" : "Santorini Sunset Vista");
  const localCat = input.localCategory || 'beach';
  const overseasCat = input.overseasCategory || 'wedding_ceremony';
  const guestCount = input.guestCount || 50;

  // Let's craft specific high-end fallbacks based on input combinations
  if (isLocal) {
    let title = "Serene Coastal Ocean Breeze Gathering";
    let tagline = "A curated, sun-draped celebration of beachside luxury and curated coastal delicacies.";
    let description = "Coastal sunset champagne greeting and custom oyster bar setup.";
    let mainFood = "Charred Local Sea Bass with Meyer Lemon Relish";
    let venueDetails = "Private beachfront deck reserved exclusively with bamboo trellis, fairy lights, and customized sand pathways.";

    if (localCat === 'hotel') {
      title = "Grand Ballroom & Terraced Soirée";
      tagline = "An opulent banquet designed with contemporary high-ceiling floral structures.";
      description = "Welcome reception featuring artisanal mocktails and truffle hors d'œuvres.";
      mainFood = "Slow-Roasted Sirloin with Rosemary-Infused Red Wine Demi-Glace";
      venueDetails = "Luxury 5-star grand ballroom with seamless terrace integration for cocktail hour.";
    } else if (localCat === 'restaurant') {
      title = "Curated Gastronomic Intimate Feast";
      tagline = "A Michelin-inspired culinary journey celebrating hand-harvested ingredients.";
      description = "Four-course chef's tasting pairing experience with custom menu introductions.";
      mainFood = "Seared Hokkaido Scallops paired with Wild Chanterelle Purée";
      venueDetails = "Private dining room featuring custom warm-lighting, hand-made pottery, and customized jazz accompaniments.";
    } else if (localCat === 'resort') {
      title = "Lush Lagoon Canopy Gala";
      tagline = "A premium garden-resort getaway designed for total immersion in nature.";
      description = "Open-air canopy reception with organic flower decoration and live acoustic set.";
      mainFood = "Wood-fired Herb Crusted Ribeye served with local heirloom vegetables";
      venueDetails = "Lakeside garden canopy pavilion featuring premium teakwood loungers and fireside lounges.";
    }

    return {
      title,
      tagline,
      location: `${location}, Local Luxury Haven`,
      estimatedBudgetRange: `$${(guestCount * 120).toLocaleString()} - $${(guestCount * 220).toLocaleString()} USD`,
      itinerary: [
        { time: "04:30 PM", activity: "Guest Arrival & Welcome Refreshments", description },
        { time: "05:30 PM", activity: "Primary Event Presentation & Celebration Toast", description: "Bespoke ceremony/address highlighting customized details." },
        { time: "06:30 PM", activity: "Interactive Catering Experience", description: `Unveiling the customized ${input.cateringStyle.replace(/_/g, ' ')} menu.` },
        { time: "08:30 PM", activity: "Dessert Cascade & Lounge Toast", description: "Open floor with live musical curation, signature espresso, and custom dessert table." },
        { time: "10:00 PM", activity: "Farewell Gifting & Departure", description: "Guests receive personalized artisan parting gifts tailored to the venue's spirit." }
      ],
      cateringMenu: [
        { category: "Appetizers", name: "Truffle Crème & Wild Mushroom Crostini", description: "Infused with cold-pressed olive oil, fresh thyme, and toasted artisan sourdough." },
        { category: "Appetizers", name: "Crispy Citrus Prawn Skewers", description: "Glazed with a subtle ginger-lemongrass reduction and toasted sesame." },
        { category: "Mains", name: mainFood, description: "Crafted specifically for your select guest profile with local, seasonal ingredients." },
        { category: "Desserts", name: "Decadent Valrhona Chocolate Lava Dome", description: "Served warm with a raspberry coulis core and Madagascar vanilla bean gelato." },
        { category: "Beverages", name: "Signature Coastal Lavender Infusion", description: "A refreshing mocktail of organic lavender, hand-pressed lemon, and premium tonic." }
      ],
      message: {
        invitationSubject: `Join us for an exclusive evening: ${title}`,
        invitationBody: `Dear Cherished Guest,\n\nWe are delighted to invite you to join us at ${location} for the ${title}.\n\nPrepare for a custom curated ${input.cateringStyle.replace(/_/g, ' ')} experience featuring exquisite seasonal culinary pairings, breathtaking views, and shared moments.\n\nYour presence would make this celebration truly extraordinary.\n\nWarmly,\nEvent Host`,
        rsvpDeadlineNote: `Kindly RSVP by the 1st of next month. Please mention any specific dietary requests or preferences.`
      },
      weatherForecast: {
        conditions: "Partly cloudy with pleasant evening breeze",
        temperatureAvg: "22°C - 26°C",
        advice: "The open-air breeze makes light layers perfect. Outdoors is highly recommended for the sunset duration.",
        indoorContingencyNeeded: localCat === 'beach' || localCat === 'resort',
        contingencyPlan: "In case of wind or sudden light shower, our luxurious adjacent sheltered pavilion is reserved with glass curtains ready for immediate seamless transition."
      },
      eventChecklist: [
        "Confirm guest count and dietary specifications",
        "Coordinate with the venue event manager regarding specialized AV requirements",
        "Finalize table placement designs and color palette accents",
        "Schedule florist delivery for 2 hours prior to guest arrival",
        "Brief photographer on key timeline highlights and specific message segments"
      ]
    };
  } else {
    // Overseas Fallback
    let title = "Grand European Destination Wedding & Soirée";
    let tagline = "A pristine overseas dream experience blending breathtaking architectural wonders with flawless hospitality.";
    let description = "Exclusive oceanfront chapel ceremony and flight greeting coordination.";
    let mainFood = "Saffron Infused Lobster Tail with Caviar Emulsion";
    let venueDetails = "Majestic cliffside chapel and private villa with dynamic views of the Mediterranean.";

    if (overseasCat === 'air_ticket') {
      title = "Seamless Global Travel & Executive Summit";
      tagline = "Curated multi-stop flight management, luxury hotel transfers, and flawless VIP transit.";
      description = "First-class lounge access, priority transit check-in, and personalized hotel arrival briefings.";
      mainFood = "Artisanal Aged Wagyu Filet with Truffle Jus";
      venueDetails = "Luxury executive penthouses and rooftop panoramas in the heart of the global hub.";
    } else if (overseasCat === 'hotel') {
      title = "Overseas Majestic Resort Escape";
      tagline = "Curated resort sanctuary booking, wellness retreats, and private group catering.";
      description = "Sunset terrace orientation and bespoke travel welcome amenities.";
      mainFood = "Herb-crusted Sea Bream with Sicilian Olive Tapenade";
      venueDetails = "Five-star heritage estate with private beaches, tailored pools, and bespoke butler service.";
    }

    return {
      title,
      tagline,
      location: `${location}, Overseas Destination`,
      estimatedBudgetRange: `$${(guestCount * 300).toLocaleString()} - $${(guestCount * 550).toLocaleString()} USD`,
      itinerary: [
        { time: "Day 1 - 02:00 PM", activity: "Airport VIP Arrival & Private Chauffeur Transfers", description: "Bespoke welcome fleet picks up guests with cold-pressed juices and luxury hot towels." },
        { time: "Day 1 - 06:30 PM", activity: "Sun-Kissed Welcome Cocktail Reception", description },
        { time: "Day 2 - 04:00 PM", activity: "Main Ceremony & Grand Vow Exchange", description: `Stunning custom decor set up in ${location} with local botanical accent installations.` },
        { time: "Day 2 - 06:00 PM", activity: "The Grand Banquet Feast", description: `A high-end curated ${input.cateringStyle.replace(/_/g, ' ')} dinner highlighting local global flavors.` },
        { time: "Day 3 - 10:00 AM", activity: "Farewell Champagne Brunch & Photo Session", description: "Post-event relaxation overlooking the gorgeous landscapes before departure transfers." }
      ],
      cateringMenu: [
        { category: "Appetizers", name: "Pan-Seared Foie Gras with Fig Compote", description: "Served over crispy brioche with a micro-herb salad and balsamic reduction." },
        { category: "Appetizers", name: "Oyster Pearls in Champagne Jelly", description: "Ultra-fresh local oysters with a touch of gold leaf and finger lime caviar." },
        { category: "Mains", name: mainFood, description: "Bespoke masterwork dish incorporating authentic ingredients native to the overseas destination." },
        { category: "Desserts", name: "Deconstructed Amalfi Lemon Tart", description: "Crisp hazelnut sable, lemon-curd foam, and candied basil elements." },
        { category: "Beverages", name: "The Destination Elderflower Royale", description: "Artisanal sparkling nectar, organic elderflower, fresh mint, and sparkling local grape." }
      ],
      message: {
        invitationSubject: `Embark on an Overseas Dream: ${title}`,
        invitationBody: `Dear Cherished Guest,\n\nWe are overjoyed to invite you to embark on an unforgettable adventure to ${location} for the ${title}.\n\nThis celebration features air travel coordination assistance, exquisite luxury accommodation, and a magnificent celebration itinerary custom-tailored to celebrate this special milestone.\n\nWe cannot wait to celebrate this monumental chapter with you in paradise.\n\nWith all our love,\nEvent Coordinators`,
        rsvpDeadlineNote: `Kindly complete your RSVPs and submit your passport/travel details by 60 days prior to the departure date.`
      },
      weatherForecast: {
        conditions: "Beautiful, warm tropical breeze with mild evenings",
        temperatureAvg: "24°C - 29°C",
        advice: "Perfect climate for light, breathable resort wear. Sunset offers magnificent outdoor photo opportunities.",
        indoorContingencyNeeded: true,
        contingencyPlan: "Should unexpected weather arise, our grand indoor veranda with floor-to-ceiling glass paneling provides identical panoramic views under total climate-controlled comfort."
      },
      eventChecklist: [
        "Coordinate and secure block booking for overseas flights",
        "Collect guest passport numbers and verify visa requirements for the destination",
        "Finalize floral specifications with our on-site local destination partner",
        "Schedule technical sound-check for the outdoor amphitheater sound system",
        "Provide guests with the custom travel itinerary package and packing recommendations booklet"
      ]
    };
  }
}

