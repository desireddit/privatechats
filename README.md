# PrivateChats - Secure Content Sharing Platform

A web application built with Next.js and Firebase that allows users to securely upload, share, and view content with dynamic, AI-powered watermarking for protection.

---

## ✨ Features

* **Secure Authentication:** User login and registration powered by Firebase Authentication.
* **Content Management:** Users can upload and manage their private content.
* **Access Control:** Content access is restricted to authorized users.
* **AI-Powered Watermarking:** Dynamically applies a watermark with user details and a timestamp to media.
* **Secure Media URLs:** Generates signed, short-lived URLs for accessing content to prevent hotlinking.

---

## 💻 Tech Stack

* **Framework:** Next.js (with App Router)
* **Styling:** Tailwind CSS & shadcn/ui
* **Backend & Database:** Firebase (Firestore, Authentication, Storage)
* **AI/Serverless Functions:** Google Genkit
* **Deployment:** Cloudflare Pages

---

## 🚀 Getting Started

Instructions on how to set up and run a local copy of this project.

### Prerequisites

* Node.js (v18 or later)
* A Google Firebase project

### Installation & Setup

1.  **Clone the repository:**
    ```bash
    git clone [https://github.com/desireddit/privatechats.git](https://github.com/desireddit/privatechats.git)
    cd privatechats
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Set up environment variables:**
    Create a file named `.env.local` in the root of the project and add your Firebase project configuration keys:

    ```env
    NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSy...
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
    NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=1234567890
    NEXT_PUBLIC_FIREBASE_APP_ID=1:12345...
    ```

### Running the Development Server

To run the app locally, use the following command:

```bash
npm run dev