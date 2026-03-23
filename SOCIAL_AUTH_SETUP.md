# Social Auth Setup Guide (Google & X)
Follow these steps to generate the **Client ID** and **Client Secret** required for your Supabase Dashboard.

---

## 🔑 1. Google Auth Setup

1. **Go to Google Cloud Console**:
   * Visit [console.cloud.google.com](https://console.cloud.google.com/) and log in.
2. **Create/Select a Project**:
   * Click the project dropdown at the top left and select **New Project** (or use an existing one).
3. **Configure the OAuth Consent Screen**:
   * In the left menu, go to **APIs & Services > OAuth consent screen**.
   * Select **External** and click **Create**.
   * Fill in **App Information** (App name, support email, developer contact).
   * Click **Save and Continue** through the scopes section (default is fine).
4. **Create Credentials**:
   * Go to **APIs & Services > Credentials**.
   * Click **+ CREATE CREDENTIALS** at the top and select **OAuth client ID**.
   * **Application type**: Select `Web application`.
   * **Name**: `Zenith (Supabase)` (or similar).
   * **Authorized redirect URIs**:
     * Click **+ ADD URI** and paste your Supabase Callback URL:
       `https://puhrqtwakabyvagnvcch.supabase.co/auth/v1/callback`
5. **Get Your Keys**:
   * Click **Create**. A popup will appear with your **Client ID** and **Client Secret**.
   * Paste these into the Google boxes in your Supabase Dashboard.

---

## 🐦 2. X (Twitter) Auth Setup

1. **Go to X Developer Portal**:
   * Visit [developer.x.com](https://developer.x.com/) and sign in.
2. **Create a Project & App**:
   * If you don't have one, create a **Project** and add an **App** inside it.
3. **Enable User Authentication Settings**:
   * Click your App on the dashboard to view settings.
   * Scroll down to **User authentication settings** and click **Set up** (or Edit).
4. **Configure Authentication**:
   * **App permissions**: Select `Read` (Standard login just needs read).
   * **Type of App**: Select `Web App, Automated App or Bot`.
   * **OAuth 2.0 Settings**:
     * **Callback URL / Redirect URL**: Add your Supabase Callback URL:
       `https://puhrqtwakabyvagnvcch.supabase.co/auth/v1/callback`
     * **Website URL**: Type in your app’s domain (e.g. `https://yourdomain.com`). If you don't have one yet, use a placeholder like `https://example.com`.
5. **Get Your Keys**:
   * Click **Save**.
   * It will display your **OAuth 2.0 Client ID** and **Client Secret**.
   * **⚠️ Important**: Make sure Supabase asks for *OAuth 2.0* keys. If Supabase asks for "API Key" and "API Secret", you generate those on the **Keys & Tokens** tab of your App in the X Portal under "Consumer Keys".

---

> [!TIP]
> After pasting the keys into Supabase, make sure to click **Save** at the bottom of the Supabase settings page to apply the changes.
