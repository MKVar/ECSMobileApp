import React, { useEffect, useState, useRef } from "react";
import {TouchableOpacity, View, Text, Image, StyleSheet} from "react-native";
import {Input} from "react-native-elements";
import { useTheme } from '@react-navigation/native';
import { authenticate} from "../../redux/actions";
import {useDispatch, useSelector} from "react-redux";
import Spinner from 'react-native-loading-spinner-overlay';

const LoginScreen = ({navigation}) => {
  const state = useSelector((s) => s);
  const dispatch = useDispatch();

  const { colors } = useTheme();
  const [user, setUser] = useState('');
  const [pswd, setPswd] = useState('');
  const [err, setErr] = useState('');
  const [borderColor, setBorderColor] = useState('rgba(0,0,0,0.5)');
  const [isFocused, setIsFocused] = useState({
       name: false,
       pswd: false,
  });
  const [isLoggingIn, setLoggingIn] = useState(false);

  const getAccountName = () => {
      const domainParts = state.app.tenantUrl.replace("https://", "")
          .replace("https://", "")
          .replace("www.", "")
          .split(".");
      return domainParts[0];
  }

  const onLogin = async () => {
    //
    setLoggingIn(true);
    setErr('');
    dispatch({
      type: "SET_TMP_STATE",
      payload: {
        loggingIn: true,
        loginFailed: false,
      },
    });

    try {
      console.log(user);
      console.log(pswd);
      const accountName = getAccountName();
      const authResult = await authenticate(user, pswd, accountName);
      console.log(authResult);
      if (authResult) {
        state.tmp.KazooSDK.account_id = authResult.account_id;
        state.tmp.KazooSDK.user_id = authResult.user_id;
        state.tmp.KazooSDK.auth_token = authResult.auth_token;
        await state.tmp.KazooSDK.updateAccount(); // updating Account in storage
        await state.tmp.KazooSDK.updateUser(); // updating User in storage
        const devices = await state.tmp.KazooSDK.fetchDevices(); // fetch all the softphone devices
        if (devices.length === 0) {
            // error
        }
        // device
        const device = devices[0];
        await state.tmp.KazooSDK.updateDevice(device.id); // updating Device in storage
        const authParams = {...authResult, device_id: device.id};

        await dispatch({
            type: "SET_APP_STATE",
            payload: {auth: authParams},
        });
        setLoggingIn(false);
        navigation.reset({
            index: 0,
            routes: [{name: "MainStack"}],
        });
      } else {
        // login failed
        dispatch({
            type: "SET_TMP_STATE",
            payload: {
                loggingIn: null,
                loginFailed: true,
            },
        });
        setLoggingIn(false);
        setErr("Invalid Credentials");
      }
    } catch (err) {
      dispatch({
        type: "SET_TMP_STATE",
        payload: {
          loggingIn: null,
          loginFailed: true,
        },
      });
      setLoggingIn(false);
      setErr("Invalid Credentials");
    }
  };

  const onLogout = async () => {
    await dispatch({
      type: "LOGOUT",
    });
  };
  const onInputFocus = (target) => {
    setIsFocused({
         [target]: true
       });
  };
  const onInputBlur = (target) => {
     setIsFocused({
         [target]: false
       });
  };

  const appUrl = getAccountName();

  return (
    <View style={{ justifyContent: "center", height: "100%", marginHorizontal: 20 }}>
      <Spinner
        visible={isLoggingIn}
        textContent={"Processing"}
        textStyle={styles.spinnerText}
      />
      <View
        style={{
          marginBottom: 10,
          alignItems: 'center'
        }}
      >
          <Image
          style={{
            maxWidth: 165,
            maxHeight: 130,
          }}
          source={
              appUrl === 'yummy' ? require("../../../whitelabel_config/yummy.png")
                  : require("../../../whitelabel_config/test.png")}
          resizeMode="contain"
        />
      </View>
      <View
        style={{
          marginBottom: 10,
          alignItems: 'center'
        }}
      >
          <Text
            style={{
              fontSize: 20,
              fontWeight: 'bold',
              color: "#222"
            }}
          >Welcome back</Text>
      </View>
      <View
          style={{
              marginBottom: 20,
              alignItems: 'center'
          }}
      >
         <Text style={{
             color: "red"
         }}>{err}</Text>
      </View>
      <View
        style={isFocused.name ? [styles.inputView, {borderColor: '#572a17'}] : styles.inputView}
      >
        <View style={{ position: 'absolute',
             top: -10,
             left: 20 ,
             width: 50,
             alignItems: 'center',
             backgroundColor: colors.background}}><Text>User</Text></View>
        <Input
          keyboardType="default"
          value={user}
          placeholder={"Username here."}
          onChangeText={(str) => setUser(str)}
          style={{
            borderWidth: 0,
            borderRadius: 10,
            paddingVertical: 15,
          }}
          errorStyle={{ marginBottom: 0 }}
          inputContainerStyle={{ borderBottomWidth: 0 }}
          onFocus={() => onInputFocus('name')}
          onBlur={() => onInputBlur('name')}
        />
      </View>
      <View
        style={isFocused.pswd ? [styles.inputView, {borderColor: '#572a17'}] : styles.inputView}
      >
        <View style={{ position: 'absolute',
            top: -10,
            left: 20 ,
            width: 80,
            alignItems: 'center',
            backgroundColor: colors.background}}
        >
          <Text>Password</Text>
        </View>
        <Input
          keyboardType="default"
          secureTextEntry={true}
          value={pswd}
          placeholder={"Password here."}
          onChangeText={(str) => setPswd(str)}
          style={{
              borderWidth: 0,
              paddingVertical: 15,
          }}
          errorStyle={{ marginBottom: 0 }}
          inputContainerStyle={{ borderBottomWidth: 0 }}
          onFocus={() => onInputFocus('pswd')}
          onBlur={() => onInputBlur('pswd')}
        />
      </View>
      <View style={{ marginVertical: 10,  height: 60}}>
        <TouchableOpacity
          disabled={user ==='' || pswd === ''}
          onPress={onLogin}
          style={user ==='' || pswd === '' ? [styles.buttons, {backgroundColor: "rgba(87,42,23,0.8)"}] :
              [styles.buttons, {backgroundColor: "#572a17"}]}
        >
          <View>
            <Text style={{ color: '#fff'}}>Login to my account</Text>
          </View>
        </TouchableOpacity>
      </View>
      <View style={{ marginVertical: 10,  alignItems: 'center'}}>
        <Text>Or Login With</Text>
      </View>
      <View style={{ marginVertical: 10,  height: 60}}>
        <TouchableOpacity
          disabled={user ==='' || pswd === ''}
          onPress={() =>
              alert("Our CRM is under maintenance, please try after sometime.")
          }
          style={{ flex: 1,
              justifyContent: "center",
              alignItems: "center",
              backgroundColor: "#328761",
              height: 100,
              marginHorizontal: 10,
              borderRadius: 10,
          }}
        >
          <View>
            <Text style={{ color: '#fff'}}>Mobile OTP</Text>
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
    spinnerText: {
        color: '#FFF'
    },
    inputView: {
      borderWidth: 1,
      borderRadius: 10,
      borderColor: '#777',
      height: 60,
      marginHorizontal: 10,
      marginBottom: 30,
    },
    buttons: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      height: 100,
      marginHorizontal: 10,
      borderRadius: 10,
    }
});


export default LoginScreen;
