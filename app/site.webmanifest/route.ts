export function GET() {
  return Response.json({
    name: "Color in Faith Printables",
    short_name: "Color in Faith",
    description:
      "Playful, faith-filled printable coloring pages for kids, families, and classrooms.",
    start_url: "/",
    display: "standalone",
    background_color: "#f4f7ff",
    theme_color: "#178ee8",
    icons: [
      {
        src: "/android-chrome-192x192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/android-chrome-512x512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  });
}
