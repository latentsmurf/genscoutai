# **App Name**: GenScoutAI

## Core Features:

- 3D Globe Visualization: Display a 3D globe with high-fidelity terrain and building meshes, streamed from Earth Engine MapID endpoints. Use CesiumJS/react-three-fiber for rendering.
- Street View Integration: Optionally display street view panoramas for detailed ground reference.
- Earth Engine Layers: Toggle analytic rasters (e.g., NDVI, land-cover). Use a temporal slider to select the imagery date, cloud mask composites are generated server-side.
- Flyover Mode & Paths: Key-frame timeline UI, create presets (Orbit, Crane, Sweep), and export paths as JSON.
- Snapshot Tool: Capture the current canvas as PNG/WebP for image enhancement.
- Time-of-Day Control: Apply time-of-day controls. Slider (0-24h) generates prompt token (night/blue/golden/noon/dusk) to provide context to a generative AI tool.
- Weather Control: Weather control uses prompt tokens (rain, snow, fog) to create different conditions based on tokens provided to the generative AI tool.

## Style Guidelines:

- Primary color: Deep blue (#3F51B5), evoking a sense of exploration and immersion.
- Background color: Very light blue (#E8EAF6) for a clean, unobtrusive backdrop.
- Accent color: A slightly brighter, desaturated indigo (#5C6BC0) to highlight interactive elements and controls, providing contrast without overwhelming the user interface.
- Clean and modern sans-serif font for both UI elements and data displays, optimized for readability on-screen.
- Simple, geometric icons for tools and features, ensuring clarity and ease of use.
- A clean, intuitive layout, designed to minimize distractions, allowing users to focus on the 3D globe. Key controls are placed on a translucent floating panel.
- Subtle animations to transition between map layers, street view, and snapshot modes, ensuring a smooth user experience.