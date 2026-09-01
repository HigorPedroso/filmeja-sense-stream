import UIKit
import Capacitor

@UIApplicationMain
class AppDelegate: UIResponder, UIApplicationDelegate {

    var window: UIWindow?

    func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
        // Override point for customization after application launch.
        DispatchQueue.main.async { [weak self] in
            self?.showAnimatedSplash()
        }
        return true
    }

    // LaunchScreen.storyboard can only show a static frame (iOS renders it
    // before any app code runs), so this overlay picks up right where that
    // frame leaves off — same image, same full-bleed layout — and animates
    // a slow zoom + fade into the real content. Android isn't touched by
    // any of this; it keeps its own native Android 12 SplashScreen API
    // animation, unrelated to this iOS-only view.
    private func showAnimatedSplash() {
        guard let window = self.window else { return }

        let overlay = UIView(frame: window.bounds)
        overlay.backgroundColor = .white
        overlay.autoresizingMask = [.flexibleWidth, .flexibleHeight]

        let imageView = UIImageView(frame: window.bounds)
        imageView.image = UIImage(named: "Splash")
        imageView.contentMode = .scaleAspectFill
        imageView.clipsToBounds = true
        imageView.autoresizingMask = [.flexibleWidth, .flexibleHeight]
        overlay.addSubview(imageView)

        window.addSubview(overlay)

        UIView.animate(
            withDuration: 0.9,
            delay: 0.3,
            options: [.curveEaseInOut],
            animations: {
                imageView.transform = CGAffineTransform(scaleX: 1.06, y: 1.06)
                overlay.alpha = 0
            },
            completion: { _ in
                overlay.removeFromSuperview()
            }
        )
    }

    func applicationWillResignActive(_ application: UIApplication) {
        // Sent when the application is about to move from active to inactive state. This can occur for certain types of temporary interruptions (such as an incoming phone call or SMS message) or when the user quits the application and it begins the transition to the background state.
        // Use this method to pause ongoing tasks, disable timers, and invalidate graphics rendering callbacks. Games should use this method to pause the game.
    }

    func applicationDidEnterBackground(_ application: UIApplication) {
        // Use this method to release shared resources, save user data, invalidate timers, and store enough application state information to restore your application to its current state in case it is terminated later.
        // If your application supports background execution, this method is called instead of applicationWillTerminate: when the user quits.
    }

    func applicationWillEnterForeground(_ application: UIApplication) {
        // Called as part of the transition from the background to the active state; here you can undo many of the changes made on entering the background.
    }

    func applicationDidBecomeActive(_ application: UIApplication) {
        // Restart any tasks that were paused (or not yet started) while the application was inactive. If the application was previously in the background, optionally refresh the user interface.
    }

    func applicationWillTerminate(_ application: UIApplication) {
        // Called when the application is about to terminate. Save data if appropriate. See also applicationDidEnterBackground:.
    }

    // @capacitor/push-notifications only fires its JS "registration"/
    // "registrationError" events once these are forwarded — without them
    // PushNotifications.register() silently never resolves on iOS, even
    // though the OS-level permission prompt and registration succeed.
    func application(_ application: UIApplication, didRegisterForRemoteNotificationsWithDeviceToken deviceToken: Data) {
        NotificationCenter.default.post(name: .capacitorDidRegisterForRemoteNotifications, object: deviceToken)
    }

    func application(_ application: UIApplication, didFailToRegisterForRemoteNotificationsWithError error: Error) {
        NotificationCenter.default.post(name: .capacitorDidFailToRegisterForRemoteNotifications, object: error)
    }

    func application(_ app: UIApplication, open url: URL, options: [UIApplication.OpenURLOptionsKey: Any] = [:]) -> Bool {
        // Called when the app was launched with a url. Feel free to add additional processing here,
        // but if you want the App API to support tracking app url opens, make sure to keep this call
        return ApplicationDelegateProxy.shared.application(app, open: url, options: options)
    }

    func application(_ application: UIApplication, continue userActivity: NSUserActivity, restorationHandler: @escaping ([UIUserActivityRestoring]?) -> Void) -> Bool {
        // Called when the app was launched with an activity, including Universal Links.
        // Feel free to add additional processing here, but if you want the App API to support
        // tracking app url opens, make sure to keep this call
        return ApplicationDelegateProxy.shared.application(application, continue: userActivity, restorationHandler: restorationHandler)
    }

}
