# 📱 SmartFocusTimer
SmartFocusTimer is a Pomodoro-style productivity app built with React Native that personalises focus sessions using machine learning. It leverages Contextual Bandits with Thompson Sampling to recommend optimal focus and break durations based on user behaviour and session context.

## 🔑 Key Features
- **🧠 Intelligent Session Recommendations:** Adapts over time to your focus habits using real-time learning.
- **⏱️ Customizable Pomodoro Timers:** Set your preferred work/break intervals.
- **📊 Progress Tracking:** Visualise your streaks, focus efficiency, and improvement trends.
- **⚙️ Offline-First Architecture:** Designed to work seamlessly even without internet access using SQLite.
- **🔍 Behaviour Modeling:** Continuously learns from your focus history to boost productivity.

## 🧩 Core Build
- React Native, SQLite, Contextual Bandits (Thompson Sampling)
- Clean architecture and modular state management for scalability

## Installation
**Run the following command to clone the repository:**
- Clone the Repository
   ```bash
   git clone https://github.com/kimothDev/SmartFocusTimer.git
   cd SmartFocusTimer
  ```
- Install Dependencies
  ```bash
   npm install
  ```
- Run on Android
  ```bash
  npx react-native run-android
  ```
  Make sure you have Android Studio and an emulator or device connected.
  
## License
This project is licensed under the AGPL-3.0 license - see the LICENSE file for details.
