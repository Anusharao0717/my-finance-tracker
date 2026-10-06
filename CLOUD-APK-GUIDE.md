# Build My Finance Tracker APK without Android Studio

You do not need Android Studio on your computer.

## 1. Create a GitHub repository

Create a new repository on GitHub, for example:

`my-finance-tracker`

## 2. Upload this project

Upload all files and folders from this project to the GitHub repository.

Make sure `.github/workflows/build-apk.yml` is uploaded too.

## 3. Start the cloud build

On GitHub:

1. Open the repository.
2. Select **Actions**.
3. Select **Build Android APK**.
4. Click **Run workflow**.
5. Wait for the workflow to finish successfully.

GitHub will build the Android APK using its cloud runner. Android Studio is not required on your PC.

## 4. Download the APK

Open the completed workflow run and find **Artifacts**.

Download:

`MyFinanceTracker-debug-apk`

Extract the ZIP and you will find:

`app-debug.apk`

## 5. Install on your phone

Send `app-debug.apk` to your Android phone, open it, and allow installation when Android asks.

After installation, the app can be used daily. Your finance data is stored locally on the device.

### Important

This workflow uses Node.js 20 and Java 17 in the cloud, so your current local Node.js 16 installation does not prevent the cloud build.
