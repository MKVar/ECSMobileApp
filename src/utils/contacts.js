import { store } from "../redux/store";

import {
  parsePhoneNumber,
  parsePhoneNumberFromString,
} from "libphonenumber-js";

export const numberToContact = (numberToCheck) => {
  // currently returns only 1 match!
  // - TODO: return list of matching contacts

  const state = store.getState();

  const checkNumber = (num) => {
    let findSchemaDefaultFunc = (c) =>
      c.info?.phoneNumbers?.find((n) => n.digits == num);
    let inRemoteList, inRemoteMine, inLocal;
    try {
      let found1 = state.app.contactlists?.find((cl) =>
        cl.Contacts.find(findSchemaDefaultFunc)
      );
      if (found1) {
        inRemoteList = found1?.contacts?.find(findSchemaDefaultFunc);
      }
    } catch (err) {
      console.error('Failed "remoteList"', err);
    }
    try {
      inRemoteMine = state.app.contacts?.find(findSchemaDefaultFunc);
    } catch (err) {
      console.error('Failed "mine"', err);
    }
    try {
      inLocal = state.app.contacts_local?.find((c) =>
        c.phoneNumbers?.find((n) => n.number == num)
      );
    } catch (err) {}
    return [
      inRemoteList,
      inRemoteMine,
      inLocal ? { ...inLocal, schema: "ios" } : null,
    ];
  };

  // exact match
  let result = checkNumber(numberToCheck);
  let idx;
  if ((idx = result.findIndex((n) => n)) > -1) {
    return result[idx];
  }

  // remove_plus
  if (numberToCheck.indexOf("+") == 0) {
    result = checkNumber(numberToCheck.toString().slice(1));
    if ((idx = result.findIndex((n) => n)) > -1) {
      return result[idx];
    }

    // ten_digit (no country code)
    if (numberToCheck.length >= 10) {
      result = checkNumber(numberToCheck.toString().slice(-10));
      if ((idx = result.findIndex((n) => n)) > -1) {
        return result[idx];
      }
    }
  } else {
    // didnt have a plus
    // - check ten_digit (no country code)
    if (numberToCheck.length >= 10) {
      result = checkNumber(numberToCheck.toString().slice(-10));
      if ((idx = result.findIndex((n) => n)) > -1) {
        return;
      }
    }
  }
};

export const numberToConversationFormat = (number) => {
  // turn incorrectly-formatted numbers (ie without the "+1") into the correct format for matching a conversation "otherNumber" (always international format unless Internal users!)
  if (number?.length < 6) {
    return number;
  }
  // format international (forcing US currently)
  const parsed = parsePhoneNumber(number, "US");
  try {
    return parsed.formatInternational().split(" ").join("");
  } catch (err) {
    // parsed.country;
    console.error("Invalid numberToConversationFormat:", number);
    return number;
  }
};

export const contactToName = (contact) => {
  switch (contact?.schema) {
    case "v0.1":
      return contact.info?.firstName?.length
        ? `${contact.info?.firstName}${
            contact.info.lastName?.length ? ` ${contact.info.lastName}` : ""
          }`
        : contact.info?.lastName;
    case "ios":
      // for local phone numbers
      return contact.name;
    default:
      console.error("Invalid showName schema");
      return null;
  }
};

export const getNumberMask = (value) => {
  let mask;
  let len = value?.length;
  // console.log("getmask valuelen:", len);
  if (len <= 4) {
    mask = "[000099]";
  } else if (len <= 5) {
    mask = "[000]-[99999]";
  } else if (len <= 7) {
    mask = "[000]-[009999]";
  } else if (len <= 10) {
    mask = "([000]) [000]-[00009]";
  } else if (len <= 11) {
    mask = "+[0] ([000]) [000]-[00009]";
  } else {
    mask = "+[09] ([000]) [000]-[000099999]";
  }
  return mask;
};

export const getPhoneNumber = (number = "") => {
  console.log("getPhoneNumber:", number);
  try {
    let phone_number = "";
    let phoneNumber;
    if (isString(number) && number.startsWith("conference:")) {
      return "conference-call";
    }
    if (!number.includes("+")) {
      if (number.length === 11 && `${parseInt(number, 10)}`.length === 11) {
        // make sure is a valid number to avoid parsing strings
        phone_number = parsePhoneNumber("+" + number);
        let phone_num = phone_number.formatInternational();
        let number_arr = phone_num.split(" ");
        phoneNumber =
          number_arr[0] +
          " " +
          number_arr[1] +
          "-" +
          number_arr[2] +
          "-" +
          number_arr[3];
        return phoneNumber;
      } else if (
        number.length === 10 &&
        `${parseInt(number, 10)}`.length === 10
      ) {
        phone_number = parsePhoneNumber("+1" + number);
        let phone_num = phone_number.formatInternational();
        let number_arr = phone_num.split(" ");
        phoneNumber =
          number_arr[0] +
          " " +
          number_arr[1] +
          "-" +
          number_arr[2] +
          "-" +
          number_arr[3];
        return phoneNumber;
      } else {
        return number;
      }
    } else {
      phone_number = parsePhoneNumber(number);
      let phone_num = phone_number.formatInternational();
      let number_arr = phone_num.split(" ");
      // if "+1" then hiding the "+1"
      if (number_arr[0] === "+1") {
        phoneNumber = `(${number_arr[1]}) ${number_arr[2]}-${number_arr[3]}`;
      } else {
        phoneNumber = `${number_arr[0]} (${number_arr[1]}) ${number_arr[2]}-${number_arr[3]}`;
      }

      // number_arr[0] +
      // " " +
      // number_arr[1] +
      // "-" +
      // number_arr[2] +
      // "-" +
      // number_arr[3];
      return phoneNumber;
    }
  } catch (err) {
    console.error("Failed parsing phone number", number, err);
    return "unknown";
  }
};
