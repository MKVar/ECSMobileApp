import React, { useEffect, useState, useRef } from "react";
import Constants from "expo-constants";
import {
  StyleSheet,
  View,
  FlatList,
  TouchableWithoutFeedback,
} from "react-native";
import { Text, SearchBar } from "react-native-elements";

import { useDispatch, useSelector } from "react-redux";

import { useIsFocused, useNavigation } from "@react-navigation/native";
import LottieView from "lottie-react-native";
import { ANIMATION_EMPTY_FOLDER, ANIMATION_HELLO } from "../../assets/lottie";

import * as Contacts from "expo-contacts";
import { AlphabetList } from "react-native-section-alphabet-list";
import { cloneDeep } from "lodash";
import {
  Divider,
  Button,
  ThemeProvider,
  ButtonGroup,
} from "react-native-elements";
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';

const Tab = createMaterialTopTabNavigator();

const ContactsData = ({ isViewPhoneList, hideNewButton, hideSearch }) => {
  const state = useSelector((s) => s);
  const dispatch = useDispatch();
  const [listData, setListData] = useState([]);
  const navigation = useNavigation();
  const isFocused = useIsFocused();
  const [searchIsFocused, setSearchIsFocused] = useState(null);
  const [searchText, setSearchText] = useState("");

  useEffect(() => {
    let newListData = [];
    if (isViewPhoneList) {
      newListData = state.app.contacts_local?.map((phoneContact) => ({
        ...phoneContact,
        key: phoneContact.id.toString(),
        value: `${phoneContact.lastName ?? phoneContact.firstName}`,
        // schema: "ios",
        // source: "local",
      }));
    } else {
      newListData = (state.app.contacts ?? []).map((c) => ({
        // schema: "v0.1",
        ...c,
        key: c.id.toString(),
        value: `${
            c.info?.lastName?.length ? c.info?.lastName : c.info?.firstName
        }`,
      }));
    }
    setListData(newListData);
  }, [isViewPhoneList, state.app.contacts, state.app.contacts_local]);

  const handleViewContact = (contact) => () => {
    // console.log("contact:", contact);
    navigation.navigate("ContactStack", {
      screen: "ContactView",
      params: {
        contactId: contact.id,
        source: contact.source,
      },
    });
  };

  return (
    <View style={{ flex: 1 }}>
      {searchIsFocused ? null : (
        <View
          style={{
            flexDirection: "row",
            backgroundColor: "#fff",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          {hideNewButton ? null : (
            <>
              <View
                style={{
                  width: 100,
                  justifySelf: "flex-end",
                  alignItems: "flex-end",
                }}
              >
                {isViewPhoneList ? (
                  <Button
                    title={"Import"}
                    type="clear"
                    onPress={(e) => {
                      alert("not done");
                      // setChooseFilter(true);
                      // dispatch({ type: "FILES_CLEAR" });
                      // RNFetchBlob.session("audio").dispose().catch();
                    }}
                  />
                ) : (
                  <Button
                    title={"New"}
                    type="clear"
                    onPress={(e) => {
                      navigation.navigate("ContactNew", {});
                    }}
                  />
                )}
              </View>
            </>
          )}
        </View>
      )}
      {!listData?.length && state.tmp.contacts_view != 1 ? (
        <View
          style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
        >
          <View>
            <LottieView
              key={isFocused} // for re-animating when nav here!
              style={{
                width: 200,
                height: 200,
                // backgroundColor: "#eee",
              }}
              source={ANIMATION_HELLO}
              autoPlay
              loop={true}
            />
          </View>
          <Text style={{ marginTop: 8 }}>
            You don't have any Tokdesk Contacts yet!
          </Text>
          <Text style={{ marginTop: 8 }}>
            You can import them from your phone,
          </Text>
          <Text style={{}}>
            or create them using the Button in the top-right
          </Text>
          <Text style={{ marginTop: 8 }}>
            CallingIO Contacts are synced between devices
          </Text>
          <Text style={{}}>and can be shared with co-workers</Text>
          <View style={{ height: 80 }}></View>
        </View>
      ) : (
        <>
          <View style={{ paddingTop: searchIsFocused ? 20 : 0 }}>
            <SearchBar
              lightTheme
              platform="ios"
              placeholder="Search"
              onFocus={() => setSearchIsFocused(true)}
              onBlur={() => setSearchIsFocused(null)}
              onChangeText={setSearchText}
              value={searchText}
            />
          </View>
          <Divider />
          <View style={{ flex: 1, backgroundColor: "#fff" }}>
            <AlphabetList
              key={isViewPhoneList}
              uncategorizedAtTop
              keyboardShouldPersistTaps={"always"} // tappable list even when keyboard shown!
              data={listData}
              style={{ flex: 1 }}
              indexLetterStyle={{
                color: "blue",
                fontSize: 15,
              }}
              renderCustomItem={(item) => {
                let name;
                // figure out what to display for the name!
                // - bolding the last name, unless the firstName is the only one that exsits
                switch (item.schema) {
                  case "ios":
                    return (
                      <LocalContact
                        item={item}
                        handleViewContact={handleViewContact}
                      />
                    );
                  case "v0.1":
                    return (
                      <DefaultContact
                        item={item}
                        handleViewContact={handleViewContact}
                      />
                    );
                  default:
                    return <View />;
                }
              }}
              renderCustomSectionHeader={(section) => (
                <View style={styles.sectionHeaderContainer}>
                  <Text h4 h4Style={styles.sectionHeaderLabel}>
                    {section.title}
                  </Text>
                </View>
              )}
            />
          </View>
        </>
      )}
    </View>
  );
};

export const PhoneContacts = () => {
  return (
    <ContactsData
      isViewPhoneList={true}
      hideSearch={false}
      hideNewButton={false}
    />
  );
};
const AppContacts = () => {
  return (
      <ContactsData
        isViewPhoneList={false}
        hideSearch={false}
        hideNewButton={false}
      />
  );
};

export default function ContactsList({ hideSearch, hideNewButton}) {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarLabelStyle: { fontSize: 14, fontWeight: 'bold'},
        tabBarIndicatorStyle: { backgroundColor: '#ECB22E', height: 2},
      }}
    >
      <Tab.Screen name="App" component={AppContacts} />
      <Tab.Screen name="Phone" component={PhoneContacts} />
    </Tab.Navigator>
  );
};

const LocalContact = ({ item, handleViewContact }) => {
  return (
    <TouchableWithoutFeedback onPress={handleViewContact(item)}>
      <View style={styles.listItemContainer}>
        <View style={styles.listItemIcon}></View>
        <View style={styles.listItemContent}>
          <View style={{ flex: 1, justifyContent: "center" }}>
          <Text h4 h4Style={styles.listItemLabel}>
            {item.lastName?.length ? (
              <Text>{item.firstName} </Text>
            ) : (
              <Text style={{ fontWeight: "bold" }}>{item.firstName} </Text>
            )}
            {item.lastName ? (
              <Text style={{ fontWeight: "bold" }}>{item.lastName} </Text>
            ) : null}
          </Text>
          {item.company?.length ? (
            <Text style={{ opacity: 0.7 }}>{item.company}</Text>
          ) : null}
          </View>
        </View>
      </View>
    </TouchableWithoutFeedback>
  );
};

const DefaultContact = ({ item, handleViewContact }) => {
  return (
    <TouchableWithoutFeedback onPress={handleViewContact(item)}>
      <View style={styles.listItemContainer}>
        <View style={styles.listItemIcon}></View>
        <View style={styles.listItemContent}>
          <View style={{ flex: 1, justifyContent: "center" }}>
            <Text h4 h4Style={styles.listItemLabel}>
              {item.info.lastName?.length ? (
                <Text>{item.info.firstName} </Text>
              ) : (
                <Text style={{ fontWeight: "bold" }}>{item.info.firstName} </Text>
              )}
              {item.info.lastName ? (
                <Text style={{ fontWeight: "bold" }}>{item.info.lastName} </Text>
              ) : null}
            </Text>
            {item.info?.company?.length ? (
              <Text style={{ opacity: 0.7 }}>{item.info?.company}</Text>
            ) : null}
          </View>
        </View>
      </View>
    </TouchableWithoutFeedback>
  );
};

const colors = {
  background: {
    light: "white",
    dark: "#efefef",
  },

  seperatorLine: "#e6ebf2",

  text: {
    dark: "#1c1b1e",
  },

  primary: "#007aff",
};

const sizes = {
  itemHeight: 44,
  headerHeight: 30,
  listHeaderHeight: 0,

  spacing: {
    small: 10,
    regular: 15,
    large: 20,
  },
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.light,
  },

  listItemContainer: {
    flex: 1,
    flexDirection: 'row',
    paddingHorizontal: sizes.spacing.regular,
    paddingVertical: 6,
    alignItems: "center",
  },
  listItemIcon: {
    width: 40,
    height: 40,
    backgroundColor: "rgba(10,90,60,0.1)",
    borderRadius: 8
  },
  listItemContent: {
    flex: 1,
    flexDirection: "row",
    marginLeft: 8
  },
  listItemLabel: {
    color: colors.text.dark,
    fontSize: 16,
  },

  sectionHeaderContainer: {
    height: sizes.headerHeight,
    backgroundColor: colors.background.dark,
    justifyContent: "center",
    paddingHorizontal: sizes.spacing.regular,
  },

  sectionHeaderLabel: {
    color: colors.text.dark,
    fontWeight: "bold",
    fontSize: 16,
  },

  listHeaderContainer: {
    height: sizes.listHeaderHeight,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
});
