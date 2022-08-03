import React, { useEffect, useState, useRef } from "react";
import Constants from "expo-constants";

import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  TouchableWithoutFeedback,
  TextInput,
  ScrollView,
} from "react-native";
import { MaterialCommunityIcons, MaterialIcons } from "@expo/vector-icons";

import { AsYouType } from "libphonenumber-js";
import { useIsFocused } from "@react-navigation/native";

import LottieView from "lottie-react-native";
import {
  Divider,
  Button,
  ThemeProvider,
  Badge,
  ListItem,
  Input,
} from "react-native-elements";
import { useSelector, useDispatch } from "react-redux";
import useEffectOnce from "react-use/lib/useEffectOnce";

import { ModalBottom } from "../../../../modules/ModalBottom";
import {
  contactToName,
  getNumberMask,
  getPhoneNumber,
} from "../../../../utils/contacts";

export default function LocalSource({ contact }) {
  const state = useSelector((s) => s);
  const dispatch = useDispatch();

  /*
      phoneNumbers: [{
        "countryCode": "us",
        "id": "C338E45E-5C9F-4772-83FB-87C3DB7E78DC",
        "number": "(815) 201-5242",
        "digits": "8152015242",
        "label": "mobile"
      }]
  */

  // useEffect(() => {
  //   navigation.setOptions({
  //     title: "", //contactToName(contact),
  //     headerRight: () => (
  //       <Button title="Edit" type="clear" onPress={handleGotoEdit} />
  //     ),
  //   });
  // }, [navigation]);

  return (
    <>
      <View style={{ flex: 1 }}>
        <ScrollView style={{ flex: 1 }}>
          <View style={{ height: 30 }}></View>
          {/* First Name */}
          <Text>First Name LOCAL</Text>
          {/* LastName */}
          {/* Company */}

          <View style={{ height: 30 }}></View>
          {/* Phone Numbers */}
          {/* <PhoneNumbers numbers={contact.phn} /> */}
        </ScrollView>
      </View>
    </>
  );
}

// const PhoneNumbers = ({ control, setValue }) => {
//   const { fields, append, prepend, remove, swap, move, insert } = useFieldArray(
//     {
//       control, // control props comes from useForm (optional: if you are using FormContext)
//       name: "phoneNumbers", // unique name for your Field Array
//       // keyName: "id", default to "id", you can change the key name
//     }
//   );

//   const handleAdd = () => {
//     append({
//       id: uuidv4(),
//       countryCode: "us",
//       number: "",
//       digits: "",
//       label: "mobile",
//     });
//   };

//   return (
//     <>
//       {fields.map((field, index) => (
//         <PhoneNumber
//           key={field.id}
//           field={field}
//           index={index}
//           control={control}
//           remove={remove}
//           setValue={setValue}
//           setValueParentPath={`phoneNumbers.${index}`}
//         />
//       ))}

//       <ListItem
//         topDivider={fields.length > 0}
//         onPress={handleAdd}
//         containerStyle={{ padding: 0 }}
//       >
//         <View style={{ padding: 16 }}>
//           <Badge value="+" status="success" />
//         </View>
//         <View>
//           <Text>add phone</Text>
//         </View>
//       </ListItem>
//       {/* <View
//         style={{
//           marginTop: fields.length > 0 ? 12 : 0,
//           flexDirection: "row",
//           alignItems: "center",
//         }}
//         onPress={handleAdd}
//       >
//         <View style={{ padding: 12, paddingLeft: 14 }}>
//           <Badge value="+" status="success" />
//         </View>
//         <View style={{ padding: 12 }}>
//           <Text>Add Phone Number</Text>
//         </View>
//       </View> */}
//     </>
//   );
// };

// const PhoneNumber = ({ value }) => {
//   return (
//     <ListItem topDivider containerStyle={{ padding: 0 }}>
//       <View style={{ padding: 16 }}>
//         <TouchableWithoutFeedback onPress={(e) => remove(index)}>
//           <Badge value="-" status="error" />
//         </TouchableWithoutFeedback>
//       </View>
//       <View>
//         <Text>mobile</Text>
//       </View>
//       <ListItem.Content>
//         <ListItem.Title>{}</ListItem.Title>
//       </ListItem.Content>
//     </ListItem>
//   );
// };

const styles = StyleSheet.create({
  input: {
    fontSize: 18,
    width: "100%",
  },
});
