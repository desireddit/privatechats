# **App Name**: Desireddit

## Core Features:

- User Authentication: User sign-up and login using Reddit username, password or email, adhering to Firebase Auth best practices, integrating multi-device support and adhering to data privacy principles
- Unique ID Generation: Generation of cryptographically random unique IDs for user verification, securely stored with optional TTL for enhanced security and operational efficiency
- Real-Time Chat: Chat functionality with real-time messaging, utilizing Firestore's onSnapshot listeners, with content control measures to moderate communication until account verification
- Private Content Access: Secure content serving for approved users via short-lived, signed proxy URLs. Generation on-demand using serverless functions; protects content's original storage path
- Timed Media Handling: Temporary URLs (signed) with expiration for timed images and videos. Backend jobs for access revoke/data deletion at expiry; enforce compliance via read receipts and UI updates.
- Dynamic Watermarking: Watermarking implemented by overlaying a user-specific username and timestamp, either dynamically server-side using Cloud Run, or client-side by streaming video frames through a canvas, providing a usable tool for identifying content
- User Interface: Comprehensive user interface providing onboarding guidance, unique ID generation, a private content gallery with request access, and a media player with play/pause and timer display features.

## Style Guidelines:

- Primary color: Use a vivid purple (#9400D3) to communicate the app's secure nature.
- Background color: Use a very light purple (#F2E7FF) for the interface background, ensuring readability and visual comfort.
- Accent color: Use a rich, slightly darker blue (#00008B) to create clear contrast and guide users towards key actions and important elements.
- Body and headline font: 'Inter', a sans-serif font known for its modern and neutral appearance, makes it suitable for both headlines and body text.
- Employ minimalist icons to maintain a clean and user-friendly interface. Use icons to represent different content types and actions, enhancing the user experience through visual cues.
- Implement a card-based layout to effectively display content previews, user information, and action items. This layout is flexible, visually appealing, and easy to navigate, particularly on mobile devices.
- Introduce subtle animations and transitions to provide feedback on user interactions and improve the perceived performance of the application. Animations should be functional and not detract from the user experience.