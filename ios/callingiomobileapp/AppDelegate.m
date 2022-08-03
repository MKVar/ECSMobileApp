#import "AppDelegate.h"

#import "RNCallKeep.h"
#import <PushKit/PushKit.h>                   
#import "RNVoipPushNotificationManager.h"     

#import <React/RCTBridge.h>
#import <React/RCTBundleURLProvider.h>
#import <React/RCTRootView.h>
#import <React/RCTLinkingManager.h>

#import <React/RCTLog.h>

#import <UMCore/UMModuleRegistry.h>
#import <UMReactNativeAdapter/UMNativeModulesProxy.h>
#import <UMReactNativeAdapter/UMModuleRegistryAdapter.h>
#import <EXSplashScreen/EXSplashScreenService.h>
#import <UMCore/UMModuleRegistryProvider.h>

#if defined(FB_SONARKIT_ENABLED) && __has_include(<FlipperKit/FlipperClient.h>)
#import <FlipperKit/FlipperClient.h>
#import <FlipperKitLayoutPlugin/FlipperKitLayoutPlugin.h>
#import <FlipperKitUserDefaultsPlugin/FKUserDefaultsPlugin.h>
#import <FlipperKitNetworkPlugin/FlipperKitNetworkPlugin.h>
#import <SKIOSNetworkPlugin/SKIOSNetworkAdapter.h>
#import <FlipperKitReactPlugin/FlipperKitReactPlugin.h>

static void InitializeFlipper(UIApplication *application) {
  FlipperClient *client = [FlipperClient sharedClient];
  SKDescriptorMapper *layoutDescriptorMapper = [[SKDescriptorMapper alloc] initWithDefaults];
  [client addPlugin:[[FlipperKitLayoutPlugin alloc] initWithRootNode:application withDescriptorMapper:layoutDescriptorMapper]];
  [client addPlugin:[[FKUserDefaultsPlugin alloc] initWithSuiteName:nil]];
  [client addPlugin:[FlipperKitReactPlugin new]];
  [client addPlugin:[[FlipperKitNetworkPlugin alloc] initWithNetworkAdapter:[SKIOSNetworkAdapter new]]];
  [client start];
}
#endif

@interface AppDelegate () <RCTBridgeDelegate>

@property (nonatomic, strong) UMModuleRegistryAdapter *moduleRegistryAdapter;
@property (nonatomic, strong) NSDictionary *launchOptions;

@end

@implementation AppDelegate

- (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(NSDictionary *)launchOptions
{
#if defined(FB_SONARKIT_ENABLED) && __has_include(<FlipperKit/FlipperClient.h>)
  InitializeFlipper(application);
#endif

  [RNCallKeep setup:@{
    @"appName": @"CallingIO",
    @"maximumCallGroups": @3,
    @"maximumCallsPerCallGroup": @1,
    @"supportsVideo": @NO,
  }];
  
// NICK NOT SURE IF THE BELOW SHOULD BE HERE OR ELSEWHERE? 
  // ===== (THIS IS OPTIONAL BUT RECOMMENDED) =====
  // --- register VoipPushNotification here ASAP rather than in JS. Doing this from the JS side may be too slow for some use cases
  // --- see: https://github.com/react-native-webrtc/react-native-voip-push-notification/issues/59#issuecomment-691685841
  // [RNVoipPushNotificationManager voipRegistration];
  
  // ... continue regular code 
  
  self.moduleRegistryAdapter = [[UMModuleRegistryAdapter alloc] initWithModuleRegistryProvider:[[UMModuleRegistryProvider alloc] init]];
  self.launchOptions = launchOptions;
  self.window = [[UIWindow alloc] initWithFrame:[UIScreen mainScreen].bounds];
  #ifdef DEBUG
    [self initializeReactNativeApp];
  #else
    EXUpdatesAppController *controller = [EXUpdatesAppController sharedInstance];
    controller.delegate = self;
    [controller startAndShowLaunchScreen:self.window];
  #endif

  [super application:application didFinishLaunchingWithOptions:launchOptions];

  return YES;
}

- (RCTBridge *)initializeReactNativeApp
{
  RCTBridge *bridge = [[RCTBridge alloc] initWithDelegate:self launchOptions:self.launchOptions];

  [RNVoipPushNotificationManager voipRegistration];

  RCTRootView *rootView = [[RCTRootView alloc] initWithBridge:bridge moduleName:@"main" initialProperties:nil];
  rootView.backgroundColor = [[UIColor alloc] initWithRed:1.0f green:1.0f blue:1.0f alpha:1];

  UIViewController *rootViewController = [UIViewController new];
  rootViewController.view = rootView;
  self.window.rootViewController = rootViewController;
  [self.window makeKeyAndVisible];

  return bridge;
 }

- (NSArray<id<RCTBridgeModule>> *)extraModulesForBridge:(RCTBridge *)bridge
{
  NSArray<id<RCTBridgeModule>> *extraModules = [_moduleRegistryAdapter extraModulesForBridge:bridge];
  // If you'd like to export some custom RCTBridgeModules that are not Expo modules, add them here!
  return extraModules;
}

- (NSURL *)sourceURLForBridge:(RCTBridge *)bridge {
 #ifdef DEBUG
  return [[RCTBundleURLProvider sharedSettings] jsBundleURLForBundleRoot:@"index" fallbackResource:nil];
 #else
  return [[EXUpdatesAppController sharedInstance] launchAssetUrl];
 #endif
}

- (void)appController:(EXUpdatesAppController *)appController didStartWithSuccess:(BOOL)success {
  appController.bridge = [self initializeReactNativeApp];
  EXSplashScreenService *splashScreenService = (EXSplashScreenService *)[UMModuleRegistryProvider getSingletonModuleForClass:[EXSplashScreenService class]];
  [splashScreenService showSplashScreenFor:self.window.rootViewController];
}

// Linking API
- (BOOL)application:(UIApplication *)application openURL:(NSURL *)url options:(NSDictionary<UIApplicationOpenURLOptionsKey,id> *)options {
  return [RCTLinkingManager application:application openURL:url options:options];
}

// // Universal Links
// - (BOOL)application:(UIApplication *)application continueUserActivity:(nonnull NSUserActivity *)userActivity restorationHandler:(nonnull void (^)(NSArray<id<UIUserActivityRestoring>> * _Nullable))restorationHandler {
//  return [RCTLinkingManager application:application
//                   continueUserActivity:userActivity
//                     restorationHandler:restorationHandler];
// }


// RN VOIP Push Notifications

/* Add PushKit delegate method */

// --- Handle updated push credentials
- (void)pushRegistry:(PKPushRegistry *)registry didUpdatePushCredentials:(PKPushCredentials *)credentials forType:(PKPushType)type {
  // Register VoIP push token (a property of PKPushCredentials) with server
  [RNVoipPushNotificationManager didUpdatePushCredentials:credentials forType:(NSString *)type];
}

- (void)pushRegistry:(PKPushRegistry *)registry didInvalidatePushTokenForType:(PKPushType)type
{
  // --- TODO: The system calls this method when a previously provided push token is no longer valid for use. No action is necessary on your part to reregister the push type. Instead, use this method to notify your server not to send push notifications using the matching push token.
}

// --- Handle incoming pushes (for ios >= 11)
- (void)pushRegistry:(PKPushRegistry *)registry didReceiveIncomingPushWithPayload:(PKPushPayload *)payload forType:(PKPushType)type withCompletionHandler:(void (^)(void))completion {
  
  NSLog(@"PUSHKIT pushRegistry:didReceiveIncomingPushWithPayload:forType:withCompletionHandler:%@", 
      payload.dictionaryPayload);

  // --- NOTE: apple forced us to invoke callkit ASAP when we receive voip push
  // --- see: react-native-callkeep

  // --- Retrieve information from your voip push payload
  NSString *uuidPath = @"call-id";
  NSString *callerNamePath = @"caller-id-name";
  NSString *handlePath = @"caller-id-number";
  NSString *uuid = [payload.dictionaryPayload valueForKeyPath:uuidPath]; // TODO: what does Kazoo send?? is it call-id, or uuid, or what? (check schema on kazoo pusher!)
  // RCTLog(payload);
  NSString *callerName = [NSString stringWithFormat:@"%@ (Connecting...)", [payload.dictionaryPayload valueForKeyPath:callerNamePath]];
  NSString *handle = [payload.dictionaryPayload valueForKeyPath:handlePath];
  // NSDictionary *extra = [payload.dictionaryPayload valueForKeyPath:@"Payload"]; /* use this to pass any special data (ie. from your notification) down to RN. Can also be `nil` */

  // // // --- this is optional, only required if you want to call `completion()` on the js side
  // // // - which we do NOT want to do!!
  // [RNVoipPushNotificationManager addCompletionHandler:uuid completionHandler:completion];

  // --- Process the received push
  [RNVoipPushNotificationManager didReceiveIncomingPushWithPayload:payload forType:(NSString *)type];

  // --- You should make sure to report to callkit BEFORE execute `completion()`
  // - this means it will NOT be reported in JS! (need to make sure it isnt double-called, and called at-least-once if an outgoing call or other scenarios?)
  // - TODO: update this to be correct information from Payload? Perhaps
  // [RNCallKeep reportNewIncomingCall:uuid handle:handle handleType:@"generic" hasVideo:false localizedCallerName:callerName fromPushKit:YES payload:payload.dictionaryPayload];
  [RNCallKeep reportNewIncomingCall: uuid
                             handle: handle 
                         handleType: @"generic"
                           hasVideo: NO
                localizedCallerName: callerName
                    supportsHolding: YES
                       supportsDTMF: YES
                   supportsGrouping: YES
                 supportsUngrouping: YES
                        fromPushKit: YES
                            payload: payload.dictionaryPayload
              withCompletionHandler: nil //completion
              ];
  
  // --- You don't need to call it if you stored `completion()` and will call it on the js side.
  // - we DO want to leave this here!! we do NOT store "completion" on the JS-side (see the commented-out "addCompletionHandler" from above)
  completion();
}

// // --- Handle incoming pushes (for ios <= 10)
// - (void)pushRegistry:(PKPushRegistry *)registry didReceiveIncomingPushWithPayload:(PKPushPayload *)payload forType:(PKPushType)type {
//   //[RNVoipPushNotificationManager didReceiveIncomingPushWithPayload:payload forType:(NSString *)type];
//   NSString *uuid = payload.dictionaryPayload[@"uuid"];
//   NSString *callerName = [NSString stringWithFormat:@"%@...", payload.dictionaryPayload[@"callerName"]];
//   NSString *handle = payload.dictionaryPayload[@"handle"];
//   NSString *chatType = payload.dictionaryPayload[@"chatType"];

//   // --- this is optional, only required if you want to call `completion()` on the js side
//   // [RNVoipPushNotificationManager addCompletionHandler:uuid completionHandler:completion];

//   // --- You should make sure to report to callkit BEFORE execute `completion()`
//   [RNCallKeep reportNewIncomingCall:uuid handle:handle handleType:@"generic" hasVideo:[chatType isEqualToString:@"video"] localizedCallerName:callerName fromPushKit: YES payload:payload.dictionaryPayload];

//   // --- Process the received push
//   [RNVoipPushNotificationManager didReceiveIncomingPushWithPayload:payload forType:(NSString *)type];

//   // --- You don't need to call it if you stored `completion()` and will call it on the js side.

// }

// RN CallKeep (CallKit) 
- (BOOL)application:(UIApplication *)application
  continueUserActivity:(NSUserActivity *)userActivity
  restorationHandler:(void(^)(NSArray * __nullable restorableObjects))restorationHandler {
    return [RNCallKeep application:application
                        continueUserActivity:userActivity
                        restorationHandler:restorationHandler];  
}

@end
