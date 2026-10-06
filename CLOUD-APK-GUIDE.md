# My Finance Tracker – Cloud APK Build

This version adds:
- Add, edit and delete payments
- Add, edit and delete money received / credits
- Paid/Pending checkbox for every payment
- Paid date saved automatically when you tick Paid
- Payment History section for the selected month
- Driver Payments category with Car 2 ₹17,000 due 5th and Car 4 ₹16,000 due 2nd
- Monthly maintenance rows for all four cars
- Existing v2 local data is preserved and migrated with the new driver/maintenance rows
- Android build uses Java 21

## GitHub Actions
1. Upload/replace the project files in your `my-finance-tracker` GitHub repository.
2. Commit to the `main` branch.
3. Open **Actions** → **Build Android APK**.
4. Open the successful run.
5. Under **Artifacts**, download `MyFinanceTracker-debug-apk`.
6. Extract the ZIP and install `app-debug.apk` on Android.

No Android Studio is required.
