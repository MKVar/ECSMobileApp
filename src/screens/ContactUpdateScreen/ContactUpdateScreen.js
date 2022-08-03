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

import { useForm, useFieldArray, Controller } from "react-hook-form";

import { useIsFocused } from "@react-navigation/native";

import TextInputMask from "react-native-text-input-mask";

import { v4 as uuidv4 } from "uuid";
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
import { gql, useMutation } from "@apollo/client";
import { getContacts } from "../../redux/actions";

const CONTACT_UPDATE = gql`
  mutation contactUpdate($id: ID!, $info: JSON!) {
    contactUpdate(id: $id, info: $info) {
      success
      data
    }
  }
`;

import { ModalBottom } from "../../modules/ModalBottom";
import { contactToName, getNumberMask } from "../../utils/contacts";

export default function ContactUpdateScreen({ route, navigation }) {
  const state = useSelector((s) => s);
  const dispatch = useDispatch();
  const contact = route.params.contact;
  // console.log("CONTACT:", contact);

  const isFocused = useIsFocused();

  /*
      phoneNumbers: [{
        "countryCode": "us",
        "id": "C338E45E-5C9F-4772-83FB-87C3DB7E78DC",
        "number": "(815) 201-5242",
        "digits": "8152015242",
        "label": "mobile"
      }]
  */

  const [contactUpdate, { data, called, loading, error }] = useMutation(
    CONTACT_UPDATE
  );

  const handleUpdate = async (infoData) => {
    // console.log(
    //   "infoData2:",
    //   typeof contact.id,
    //   JSON.stringify(infoData, null, 2)
    // );
    const afterUpdate = await contactUpdate({
      variables: {
        id: contact.id,
        info: infoData,
      },
    });
    // console.log("afterUpdate:", afterUpdate);

    getContacts();

    // return to previous
    // - expecting in params
    navigation.goBack();
  };

  const {
    control,
    handleSubmit,
    setFocus,
    formState: { errors },
    watch,
    setValue,
    formState,
  } = useForm({ defaultValues: contact.info });

  // const watchAllFields = watch();

  const onSubmit = (data) => handleUpdate(data);

  useEffect(() => {
    navigation.setOptions({
      title: "Edit Contact", //contactToName(contact),
      headerRight: () => (
        <Button
          title="Save"
          type="clear"
          titleStyle={{
            fontWeight: "bold",
            color: formState.isDirty ? "#00C853" : null,
          }}
          onPress={handleSubmit(onSubmit)}
          loading={loading}
          disabled={loading || !formState.isDirty}
        />
      ),
    });
  }, [navigation, handleSubmit, loading, formState]);

  // let Modal = showFromNumberSelector ? (
  //   <ModalBottom onClose={(e) => setShowFromNumberSelector(null)}>
  //     {numbers.map((number) => (
  //       <ListItem
  //         key={number}
  //         onPress={() => {
  //           setFromNumberSelected(number);
  //           setShowFromNumberSelector(null);
  //         }}
  //       >
  //         <MaterialCommunityIcons
  //           name="pound"
  //           size={20}
  //           color="rgba(100,100,100,0.8)"
  //         />
  //         <ListItem.Content>
  //           <ListItem.Title>{number}</ListItem.Title>
  //         </ListItem.Content>
  //       </ListItem>
  //     ))}
  //   </ModalBottom>
  // ) : null;

  return (
    <>
      {/* {Modal} */}
      <View style={{ flex: 1 }}>
        <ScrollView style={{ flex: 1 }}>
          <View style={{ height: 30 }}></View>
          {/* First Name */}
          <ListItem topDivider>
            <ListItem.Content>
              <Controller
                control={control}
                rules={{
                  required: false,
                }}
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    style={styles.input}
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                    placeholder="First Name"
                    returnKeyType="next"
                    returnKeyLabel="Next"
                    onSubmitEditing={(e) => setFocus("lastName")}
                  />
                )}
                name="firstName"
                defaultValue=""
              />
              {errors.firstName && <Text>This is required.</Text>}
            </ListItem.Content>
          </ListItem>
          {/* LastName */}
          <ListItem topDivider>
            <ListItem.Content>
              <Controller
                control={control}
                rules={{
                  required: false,
                }}
                render={({ field: { onChange, onBlur, value, ref } }) => (
                  <TextInput
                    ref={ref}
                    style={styles.input}
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                    placeholder="Last Name"
                    returnKeyType="next"
                    returnKeyLabel="Next"
                    onSubmitEditing={(e) => setFocus("company")}
                  />
                )}
                name="lastName"
                defaultValue=""
              />
              {errors.lastName && <Text>This is required.</Text>}
            </ListItem.Content>
          </ListItem>
          {/* Company */}
          <ListItem topDivider bottomDivider>
            <ListItem.Content>
              <Controller
                control={control}
                rules={{
                  required: false,
                }}
                render={({ field: { onChange, onBlur, value, ref } }) => (
                  <TextInput
                    ref={ref}
                    style={styles.input}
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                    placeholder="Company"
                  />
                )}
                name="company"
                defaultValue=""
              />
              {errors.company && <Text>This is required.</Text>}
            </ListItem.Content>
          </ListItem>

          <View style={{ height: 30 }}></View>
          {/* Phone Numbers */}
          <PhoneNumbers control={control} setValue={setValue} />
        </ScrollView>
      </View>
    </>
  );
}

const PhoneNumbers = ({ control, setValue }) => {
  const { fields, append, prepend, remove, swap, move, insert } = useFieldArray(
    {
      control, // control props comes from useForm (optional: if you are using FormContext)
      name: "phoneNumbers", // unique name for your Field Array
      // keyName: "id", default to "id", you can change the key name
    }
  );

  const handleAdd = () => {
    append({
      id: uuidv4(),
      countryCode: "us",
      number: "",
      digits: "",
      label: "mobile",
    });
  };

  return (
    <>
      {fields.map((field, index) => (
        <PhoneNumber
          key={field.id}
          field={field}
          index={index}
          control={control}
          remove={remove}
          setValue={setValue}
          setValueParentPath={`phoneNumbers.${index}`}
        />
      ))}

      <ListItem
        topDivider={fields.length > 0}
        onPress={handleAdd}
        containerStyle={{ padding: 0 }}
      >
        <View style={{ padding: 16 }}>
          <Badge value="+" status="success" />
        </View>
        <View>
          <Text>add phone</Text>
        </View>
      </ListItem>
      {/* <View
        style={{
          marginTop: fields.length > 0 ? 12 : 0,
          flexDirection: "row",
          alignItems: "center",
        }}
        onPress={handleAdd}
      >
        <View style={{ padding: 12, paddingLeft: 14 }}>
          <Badge value="+" status="success" />
        </View>
        <View style={{ padding: 12 }}>
          <Text>Add Phone Number</Text>
        </View>
      </View> */}
    </>
  );
};

const PhoneNumber = ({
  control,
  field,
  index,
  remove,
  setValue,
  setValueParentPath,
  bottomDivider,
}) => {
  return (
    <ListItem topDivider containerStyle={{ padding: 0 }}>
      <View style={{ padding: 16 }}>
        <TouchableWithoutFeedback onPress={(e) => remove(index)}>
          <Badge value="-" status="error" />
        </TouchableWithoutFeedback>
      </View>
      <View>
        <Text>mobile</Text>
      </View>
      <ListItem.Content>
        <Controller
          control={control}
          rules={{
            required: false,
          }}
          render={({ field: { onChange, onBlur, value, ref } }) => (
            <PhoneNumberInput
              ref={ref}
              onChange={onChange}
              onBlur={onBlur}
              value={value}
              setValue={setValue}
              setValueParentPath={`phoneNumbers.${index}`}
            />
          )}
          name={`${setValueParentPath}.digits`}
          defaultValue=""
        />
      </ListItem.Content>
    </ListItem>
  );
};

const PhoneNumberInput = React.forwardRef(
  ({ onChange, onBlur, value, setValue, setValueParentPath }, ref) => {
    const [mask, setMask] = useState(() => getNumberMask(value));

    // useState(() => {
    //   console.log("SEETSTATE");
    //   const maskVal = getMask(value);
    //   console.log("SET:", maskVal);
    //   setMask(maskVal);
    // }, [value?.toString()]);

    // console.log("Current:", mask, value?.toString());

    return (
      <TextInputMask
        ref={ref}
        style={styles.input}
        onBlur={onBlur}
        // onChangeText={onChange}
        value={value}
        defaultValue={value}
        keyboardType="phone-pad"
        textContentType={"telephoneNumber"}
        placeholder="Phone Number"
        onChangeText={(formatted, extracted) => {
          // console.log(formatted, "::::", extracted); // +1 (123) 456-78-90
          setMask(getNumberMask(extracted));
          onChange(extracted);
          setValue(`${setValueParentPath}.number`, formatted);
        }}
        mask={mask}
      />
      // <TextInput
      //   ref={ref}
      //   style={styles.input}
      //   onBlur={onBlur}
      //   onChangeText={onChange}
      //   value={value}
      //   keyboardType="phone-pad"
      //   textContentType={'telephoneNumber'}
      //   placeholder="Phone Number"
      // />
    );
  }
);

const styles = StyleSheet.create({
  input: {
    fontSize: 18,
    width: "100%",
  },
});
