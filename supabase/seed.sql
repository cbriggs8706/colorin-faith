insert into public.products (
  slug,
  name,
  description,
  price,
  stripe_price_id,
  category,
  page_count,
  tagline,
  emoji,
  gradient,
  audience,
  features,
  featured
)
values
  (
    'fruit-of-the-spirit-coloring-pack',
    'Fruit of the Spirit Coloring Pack',
    'A cheerful printable bundle that helps kids learn the Fruit of the Spirit through friendly illustrations, traceable words, and memory prompts.',
    7,
    'price_replace_with_stripe_price_id_1',
    'Bible Study',
    12,
    'Faith meets fun',
    '🍓',
    'linear-gradient(135deg, #ffb400, #ff7a00 18%, #ef4058 46%, #1f98ee 74%, #2743b6)',
    '{"Homeschool families","Sunday school","Quiet time baskets"}',
    '{"12 printable coloring pages","Scripture memory prompts","Kid-friendly bold outlines"}',
    true
  ),
  (
    'noahs-ark-adventure-set',
    'Noah''s Ark Adventure Set',
    'Big smiles, animals, and rainbow details make this pack a playful choice for Bible lesson time and family coloring tables.',
    6,
    'price_replace_with_stripe_price_id_2',
    'Bible Story',
    10,
    'Animals, rainbows, and wonder',
    '🌈',
    'linear-gradient(135deg, #1f98ee, #1150b5 34%, #2743b6 54%, #ffb400 82%, #ff7a00)',
    '{"Preschool ministry","Church busy bags","Family activity time"}',
    '{"10 themed printable pages","Story recap moments","Designed for easy home printing"}',
    true
  ),
  (
    'easter-joy-coloring-bundle',
    'Easter Joy Coloring Bundle',
    'Celebrate resurrection Sunday with bright printable pages made for church events, classroom tables, and meaningful family conversation.',
    9,
    'price_replace_with_stripe_price_id_3',
    'Seasonal',
    16,
    'Celebration with purpose',
    '🌷',
    'linear-gradient(135deg, #e533b6, #4f1b84 26%, #2743b6 54%, #1f98ee 74%, #ef4058)',
    '{"Easter services","Christian classrooms","Family gatherings"}',
    '{"16 festive printable pages","Mix of simple and detailed designs","Great for holiday tables"}',
    true
  )
on conflict (slug) do update set
  name = excluded.name,
  description = excluded.description,
  price = excluded.price,
  stripe_price_id = excluded.stripe_price_id,
  category = excluded.category,
  page_count = excluded.page_count,
  tagline = excluded.tagline,
  emoji = excluded.emoji,
  gradient = excluded.gradient,
  audience = excluded.audience,
  features = excluded.features,
  featured = excluded.featured;

insert into public.site_content (key, value)
values (
  'homepage',
  $${
    "heroHighlight": {
      "title": "Fruit of the Spirit Coloring Pack",
      "description": "A bestselling starter set with joyful fruit characters, simple Scripture tie-ins, and printable pages that work beautifully for home or classroom use.",
      "pages": 12,
      "price": "$7"
    },
    "valueProps": [
      {
        "icon": "🖍️",
        "title": "Instantly printable",
        "description": "Customers can buy today and print right away without waiting for shipping.",
        "accent": "#FFE5B5"
      },
      {
        "icon": "📖",
        "title": "Faith-filled themes",
        "description": "From Bible stories to Scripture memory, every collection keeps the message front and center.",
        "accent": "#CDEBFF"
      },
      {
        "icon": "🎉",
        "title": "Bright and playful",
        "description": "Color palettes, shapes, and cheerful compositions feel energetic without becoming chaotic.",
        "accent": "#FFD6EA"
      },
      {
        "icon": "🏠",
        "title": "Made for real homes",
        "description": "Perfect for busy bags, homeschool stations, church classes, and kitchen table creativity.",
        "accent": "#D7F8E5"
      }
    ],
    "steps": [
      {
        "title": "Pick your favorite pack",
        "description": "Browse bright faith-based collections organized for family use, class time, and seasonal moments."
      },
      {
        "title": "Checkout with Stripe",
        "description": "Send customers through a secure mobile-friendly Stripe checkout experience with promo code support."
      },
      {
        "title": "Deliver and print",
        "description": "Connect your final file-delivery workflow so customers can access and print their pages right away."
      }
    ],
    "faqs": [
      {
        "question": "Are these physical products?",
        "answer": "No. This starter storefront is set up for digital downloads only, which keeps fulfillment simple and instant."
      },
      {
        "question": "How do customers receive their files?",
        "answer": "The site includes Stripe checkout and success pages now. For launch, connect checkout completion to a secure file delivery method such as emailed links, a download page, or a digital delivery service."
      },
      {
        "question": "Can I update products without editing code?",
        "answer": "Locally, yes. The admin page saves product updates into JSON files. For production, the next step is moving this admin flow to a persistent database or external CMS."
      },
      {
        "question": "Can I collect emails before launch?",
        "answer": "Yes. The newsletter form stores subscribers in a lightweight local file right now so you can validate the flow before connecting your email platform."
      }
    ]
  }$$::jsonb
)
on conflict (key) do update set value = excluded.value;
