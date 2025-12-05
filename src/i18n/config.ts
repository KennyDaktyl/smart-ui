import i18n from "i18next";
import { initReactI18next } from "react-i18next";

const fallbackLng = "pl";

const resources = {
  pl: {
    translation: {
      common: {
        brand: "⚡ Smart Energy",
        loadingUser: "Ładowanie danych użytkownika...",
        online: "Online",
        offline: "Offline",
        waitingForStatus: "Oczekiwanie na status...",
        noData: "Brak danych",
        notAvailable: "n/d",
        cancel: "Anuluj",
        loading: "Ładowanie...",
      },
      header: {
        menu: {
          installations: "Moje instalacje",
          raspberries: "Moje urządzenia",
          huawei: "API Huawei",
          account: "Moje konto",
          logout: "Wyloguj",
          login: "Zaloguj",
          register: "Zarejestruj",
        },
      },
      auth: {
        login: {
          title: "Logowanie",
          submit: "Zaloguj się",
          goRegister: "Rejestracja",
          errorDefault: "Nieprawidłowe dane logowania",
        },
        register: {
          title: "Rejestracja",
          submit: "Zarejestruj się",
          haveAccount: "Mam już konto",
          success: "Konto zostało utworzone. Możesz się zalogować.",
          error: "Nie udało się zarejestrować",
        },
        fields: {
          email: "Email",
          password: "Hasło",
        },
      },
      account: {
        title: "Moje konto",
        email: "Email:",
        role: "Rola:",
        huawei: "Huawei API:",
        createdAt: "Konto utworzone:",
        missingUser: "Nie znaleziono danych użytkownika.",
        noHuawei: "Brak danych",
      },
      installations: {
        title: "Moje instalacje",
        fetchError: "Nie udało się pobrać instalacji użytkownika.",
        lastUpdate: "Ostatnia aktualizacja: {{time}}",
        inverters: "Inwertery:",
        noInverters: "Brak inwerterów przypisanych do tej instalacji.",
        noInstallations: "Brak instalacji do wyświetlenia.",
        noAddress: "Brak adresu",
      },
      raspberries: {
        title: "Moje urządzenia (Raspberry)",
        fetchError: "Nie udało się pobrać urządzeń.",
        empty: "Brak zarejestrowanych Raspberry.",
        lastContact: "Ostatni kontakt: {{time}}",
        assigned: "Inwerter przypisany!",
        info: {
          software: "Soft: {{version}}",
          maxDevices: "Max urządzeń: {{count}}",
        },
        select: {
          label: "Przypisany inwerter",
        },
      },
      devices: {
        emptySlot: "Brak urządzenia w slocie {{slot}}",
        addDevice: "Dodaj urządzenie",
        slotLabel: "Slot: {{slot}}",
        powerLabel: "Moc: {{power}} kW",
        thresholdLabel: "Próg PV: {{threshold}} kW",
        waiting: "Oczekiwanie na status...",
        autoOn: "Włączony",
        autoOff: "Wyłączony",
        deleteConfirm: "Czy usunąć urządzenie \"{{name}}\"?",
        form: {
          nameLabel: "Nazwa",
          powerLabel: "Moc (kW)",
          modeLabel: "Tryb pracy",
          thresholdLabel: "Próg mocy PV (kW)",
          slotLabel: "Slot",
          modes: {
            manual: "Ręczny",
            autoPower: "Auto moc PV",
            schedule: "Harmonogram",
          },
          errors: {
            nameRequired: "Pole 'Nazwa' jest wymagane.",
            powerRequired: "Pole 'Moc (kW)' jest wymagane.",
            thresholdRequired: "Pole 'Próg mocy PV (kW)' jest wymagane.",
          },
        },
      },
      admin: {
        usersTitle: "Użytkownicy",
        role: "Rola: {{role}}",
        viewInstallations: "Zobacz instalacje",
      },
      inverters: {
        serial: "Serial: {{serial}}",
        unknownModel: "Nieznany",
      },
      power: {
        loading: "Pobieranie danych o mocy...",
        stale: "Dane o mocy są nieaktualne!",
        lastKnown: "Ostatnia znana wartość: {{timestamp}}",
        value: "Moc: {{power}} kW",
        nextUpdate: "Kolejna aktualizacja za {{seconds}} s",
        lastUpdate: "Ostatnia aktualizacja: {{timestamp}}",
        waiting: "Oczekiwanie na pierwsze dane... ({{seconds}} s)",
      },
      huawei: {
        title: "Integracja Huawei API",
        credentialsMissing: "Dane Huawei nie są skonfigurowane.",
        connectedAs: "Połączono jako: {{username}}",
        credentialsSaved: "Dane Huawei zapisane pomyślnie.",
        installationAssigned: "Instalacja przypisana",
        address: "Adres: {{address}}",
        invertersTitle: "Inwertery (Huawei):",
        errors: {
          fetchInstallations: "Nie udało się pobrać instalacji użytkownika.",
          fetchHuawei: "Nie udało się pobrać instalacji Huawei.",
          addInstallation: "Nie udało się dodać instalacji.",
          fetchInverters: "Nie udało się pobrać inwerterów z Huawei.",
          addInverter: "Nie udało się dodać inwertera do bazy.",
        },
        buttons: {
          fetchInstallations: "Pobierz instalacje Huawei",
          changeData: "Zmień dane Huawei",
          addInstallation: "Dodaj instalację i inwertery",
          showInverters: "Pokaż inwertery",
          loading: "Ładowanie...",
          addToDatabase: "Dodaj do bazy",
          alreadySaved: "Już zapisano",
        },
      },
      huaweiCredentials: {
        title: "Dane logowania Huawei API",
        username: "Huawei Username",
        password: "Huawei Password",
        save: "Zapisz dane",
        saved: "Dane Huawei zapisane pomyślnie!",
        saveError: "Błąd zapisu danych",
      },
    },
  },
  en: {
    translation: {
      common: {
        brand: "⚡ Smart Energy",
        loadingUser: "Loading user data...",
        online: "Online",
        offline: "Offline",
        waitingForStatus: "Waiting for status...",
        noData: "No data",
        notAvailable: "n/a",
        cancel: "Cancel",
        loading: "Loading...",
      },
      header: {
        menu: {
          installations: "My installations",
          raspberries: "My devices",
          huawei: "Huawei API",
          account: "My account",
          logout: "Log out",
          login: "Log in",
          register: "Register",
        },
      },
      auth: {
        login: {
          title: "Login",
          submit: "Sign in",
          goRegister: "Register",
          errorDefault: "Invalid login credentials",
        },
        register: {
          title: "Register",
          submit: "Create account",
          haveAccount: "I already have an account",
          success: "Account created. You can log in.",
          error: "Registration failed",
        },
        fields: {
          email: "Email",
          password: "Password",
        },
      },
      account: {
        title: "My account",
        email: "Email:",
        role: "Role:",
        huawei: "Huawei API:",
        createdAt: "Account created:",
        missingUser: "User data not found.",
        noHuawei: "No data",
      },
      installations: {
        title: "My installations",
        fetchError: "Failed to fetch installations.",
        lastUpdate: "Last update: {{time}}",
        inverters: "Inverters:",
        noInverters: "No inverters assigned to this installation.",
        noInstallations: "No installations to display.",
        noAddress: "No address",
      },
      raspberries: {
        title: "My devices (Raspberry)",
        fetchError: "Failed to fetch devices.",
        empty: "No registered Raspberry devices.",
        lastContact: "Last contact: {{time}}",
        assigned: "Inverter assigned!",
        info: {
          software: "Soft: {{version}}",
          maxDevices: "Max devices: {{count}}",
        },
        select: {
          label: "Assigned inverter",
        },
      },
      devices: {
        emptySlot: "No device in slot {{slot}}",
        addDevice: "Add device",
        slotLabel: "Slot: {{slot}}",
        powerLabel: "Power: {{power}} kW",
        thresholdLabel: "PV threshold: {{threshold}} kW",
        waiting: "Waiting for status...",
        autoOn: "On",
        autoOff: "Off",
        deleteConfirm: "Delete device \"{{name}}\"?",
        form: {
          nameLabel: "Name",
          powerLabel: "Power (kW)",
          modeLabel: "Mode",
          thresholdLabel: "PV threshold (kW)",
          slotLabel: "Slot",
          modes: {
            manual: "Manual",
            autoPower: "Auto PV power",
            schedule: "Schedule",
          },
          errors: {
            nameRequired: "The 'Name' field is required.",
            powerRequired: "The 'Power (kW)' field is required.",
            thresholdRequired: "The 'PV threshold (kW)' field is required.",
          },
        },
      },
      admin: {
        usersTitle: "Users",
        role: "Role: {{role}}",
        viewInstallations: "See installations",
      },
      inverters: {
        serial: "Serial: {{serial}}",
        unknownModel: "Unknown",
      },
      power: {
        loading: "Fetching power data...",
        stale: "Power data is outdated!",
        lastKnown: "Last known value: {{timestamp}}",
        value: "Power: {{power}} kW",
        nextUpdate: "Next update in {{seconds}}s",
        lastUpdate: "Last update: {{timestamp}}",
        waiting: "Waiting for first data... ({{seconds}}s)",
      },
      huawei: {
        title: "Huawei API Integration",
        credentialsMissing: "Huawei credentials are not configured.",
        connectedAs: "Connected as: {{username}}",
        credentialsSaved: "Huawei credentials saved successfully.",
        installationAssigned: "Installation assigned",
        address: "Address: {{address}}",
        invertersTitle: "Inverters (from Huawei):",
        errors: {
          fetchInstallations: "Failed to fetch user installations.",
          fetchHuawei: "Failed to fetch Huawei installations.",
          addInstallation: "Failed to add installation.",
          fetchInverters: "Failed to fetch inverters from Huawei.",
          addInverter: "Failed to add inverter to database.",
        },
        buttons: {
          fetchInstallations: "Fetch Huawei installations",
          changeData: "Change Huawei data",
          addInstallation: "Add installation and inverters",
          showInverters: "Show inverters",
          loading: "Loading...",
          addToDatabase: "Add to database",
          alreadySaved: "Already saved",
        },
      },
      huaweiCredentials: {
        title: "Huawei API credentials",
        username: "Huawei Username",
        password: "Huawei Password",
        save: "Save data",
        saved: "Huawei data saved successfully!",
        saveError: "Failed to save data",
      },
    },
  },
};

const initialLng =
  (typeof window !== "undefined" && localStorage.getItem("language")) ||
  (typeof navigator !== "undefined" && navigator.language.startsWith("pl")
    ? "pl"
    : "en");

i18n.use(initReactI18next).init({
  resources,
  lng: initialLng || fallbackLng,
  fallbackLng,
  interpolation: {
    escapeValue: false,
  },
});

export const changeLanguage = (lng: string) => {
  i18n.changeLanguage(lng);
  if (typeof window !== "undefined") {
    localStorage.setItem("language", lng);
  }
};

export default i18n;
