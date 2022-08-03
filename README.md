
# Development  

install dependencies and setup Pods for iOS: 
```
git clone REPO
cd REPO
yarn
npx pod-install
```

simulator:  
`yarn ios` 

on-device:  
`yarn ios --device xyz` 

After installing (`yarn add`) any packages, run `npx pod-install` to update iOS linking. 

### package notes: 

- react-native-callkeep: for integrating the app with the Phone's contacts/dialer/etc. Also for background tasks and keeping the app running and accepting calls (connected to server)  
- react-native-voip-push-notification: for handling push notifications 
- react-native-webrtc: polyfills for webrtc libraries   


## Problems Installing/Building? 
- First try deleting node_modules and re-running `yarn`!!! This fixes most issues in iOS pods. 



# Production/Build Notes - iOS    

## Build and Signing, Testflight Setup  

Instructions for creating certs (p12) and provisioning profiles with or without a mac: 

```bash
# Create a new cert/p12 programmatically 
# - could also export your existing p12! 
export TMP_EMAIL=youremail@example.com
export TMP_COMMON_NAME="Your Name"
export TMP_COUNTRY=US
openssl genrsa -out app.key 2048
openssl req -new -key app.key -out automaticGeneratedFromKeyname.certSigningRequest -subj "/emailAddress=${TMP_EMAIL}, CN=${TMP_COMMON_NAME}, C=${TMP_COUNTRY}"

# now create the Apple Distribution Certificate (from the Provisioning Portal)
# - require us to upload the generated "automaticGeneratedFromKeyname.certSigningRequest" 
# Download the .cer file 
# - rename to distribution.cer 

# Create p12 
openssl x509 -in distribution.cer -inform DER -out app.pem -outform PEM
# remember the password you enter in the next step! 
openssl pkcs12 -export -inkey app.key -in app.pem -out distribution.p12

# Create a new Provisioning Profile for your app
# - a DISTRIBUTION for App Store (assuming Testflight upload) 
# - "to submit your app to the App Store" -> also includes TestFlight! 
# - Download .mobileprovision file
# - Rename to "distribution.mobileprovision" 
```

## Push Notifications (VOIP and Regular)  

```
# Create new "VoIP Services Certificate" and "Apple Push Notification service SSL (Production)" certificate  
# - https://github.com/2600hz/kazoo-pusher/blob/master/doc/pusher.md 
# - certs: 
#   - "VoIP Services Certificate" for development AND production? Not even necessary?? 
#   - "Apple Push Notification service SSL (Sandbox & Production)" is for Testflight/AppStore 
#     - create this by going to Provisiong Portal, clicking the Identifier, then Push Notifications -> Configure -> Apple ... Production (it then says "Sandbox & Production!") 
# - these get combined! 

# Upload your `automaticGeneratedFromKeyname.certSigningRequest` from the above steps.  
# - for "VoIP Services Certificate": you will get a `voip_services.cer` to download
# - for "Apple Push Notification service SSL (Sandbox & Production)" you will get a "aps.cer" (or similar filename) 

# Create pem files from the .cer files: 
openssl x509 -in voip_services.cer -inform DER -out voip.pem -outform PEM 
openssl x509 -in aps.cer -inform DER -out aps.pem -outform PEM 

# Create p12 files (necessary??) 
# - remember password from this step! 
openssl pkcs12 -export -inkey app.key -in voip.pem -out voip.p12
openssl pkcs12 -export -inkey app.key -in aps.pem -out aps.p12

# Create single pems (unencrypted, hence `-nodes` flag): 
# - merge together
openssl pkcs12 -in voip.p12 -out voip_final.pem -clcerts -nodes
openssl pkcs12 -in aps.p12 -out aps_final.pem -clcerts -nodes
cat voip_final.pem aps_final.pem > merged_push_final.pem

# Check connectivity

# sandbox 
openssl s_client -connect gateway.sandbox.push.apple.com:2195 -cert merged_push_final.pem -key aps_final.pem 

# production 
openssl s_client -connect gateway.push.apple.com:2195 -cert merged_push_final.pem -key aps_final.pem 


# For "Regular" Push Notifications (being sent from the callingio-homepage-api) see https://github.com/callingio/callingio-homepage-api#push-notifications

```


## Renaming (and changing bundle id)  

The is done as part of the whitelabeling, but you might want to also do it at other times. Look in the `.github/workflows/main.yml` for details. 

Quickly...

```
# -a is for Android
npx react-native-ci-tools bundle com.callingio.newapp002 CallingIODev -a
# -i is for IOS 
npx react-native-ci-tools bundle com.callingio.newapp002 CallingIODev -i
# the following is necessary for Android (ios bundle rename is handled correctly) 
grep -rl com.callingio.app001 ./android/app | xargs sed -i "" -e 's/com.callingio.app001/com.callingio.newapp002/g'
cd android && ./gradlew clean && cd ..
```



## App Store Connect API Key  
### for upload to Testflight, determining build_number automatically  

- https://docs.fastlane.tools/app-store-connect-api/#creating-an-app-store-connect-api-key  
- will end up with a .p8 file, key_id, issuer_id  


# More (relevant) Notes  

`Enable Bitcode` is DISABLED because `react-native-webrtc` throws an error when building for Testflight (via github actions):  

```
'.../XCFrameworkIntermediates/WebRTC/WebRTC.framework/WebRTC' does not contain bitcode. You must rebuild it with bitcode enabled (Xcode setting ENABLE_BITCODE), obtain an updated library from the vendor, or disable bitcode for this target. file '.../XCFrameworkIntermediates/WebRTC/WebRTC.framework/WebRTC' for architecture arm64
```

The solution is listed on the react-native-webrtc README: https://github.com/react-native-webrtc/react-native-webrtc/blob/4c09877ac78e7f7081952d444c7ea8e05038cc45/README.md#webrtc-revision 
- basically: run some .sh file before building? 


Libraries to use: 
- https://github.com/IjzerenHein/react-native-shared-element 
- https://github.com/callstack/react-native-testing-library 




# Production/Build Notes - Android    

For Push Notifications, `google-services.json` MUST be copied to `android/app/google-services.json` (adding `android.googleServicesFile` to `app.config.js` does nothing!)  




# Other Notes (old)  


Building and Signing Requirements (currently Mac-only, Windows needs to use openssl  

1. New Apple Distribution Certificate (.cer).
   - Download to computer
   - Double-click to install locally
   - Export as p12 (provide a password that will be used later)
2. New Provisioning Profile
   - Type: Distribution -> App Store
   - Choose your correct App ID
   - Choose the Distribution Certificate you generated from previous step


Problem:  
- error: wl3 has conflicting provisioning settings. wl3 is automatically signed, but provisioning profile Whitelabel App 3 Distribution GitHub 1 has been manually specified. Set the provisioning profile value to "Automatic" in the build settings editor, or switch to manual signing in the Signing & Capabilities editor. (in target 'wl3' from project 'wl3')
Solution:  
- https://stackoverflow.com/questions/42885122/xcode-has-conflicting-provisioning-settings 

