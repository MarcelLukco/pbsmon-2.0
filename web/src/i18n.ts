import i18n from "i18next";
import { initReactI18next } from "react-i18next";

// Load language from localStorage or default to 'cs'
const savedLanguage = localStorage.getItem("i18nextLng") || "cs";

i18n.use(initReactI18next).init({
  resources: {
    en: {
      translation: {
        pages: {
          personalView: "Personal View",
          qsubAssembler: "Qsub Assembler",
          machines: "Machines",
          jobs: "Jobs",
          queues: "Jobs Queues",
          propertiesOfMachines: "Properties of Machines",
          users: "Users",
          resourceStatus: "Resource Status",
          storageSpaces: "Storage Spaces",
          waitingJobs: "Waiting Jobs",
          outages: "Outages",
          currentStatus: "Current Status",
          userSupport: "User Support",
          documentation: "Documentation",
          faq: "FAQ",
          metacentrum: "Metacentrum.cz",
        },
        queues: {
          routeQueue: "Route Queue",
          noAccess: "Access to this queue is reserved for authorized users",
          min: "Min",
          max: "Max",
          enabled: "Enabled",
          disabled: "Disabled",
          started: "Started",
          stopped: "Stopped",
          loading: "Loading queues...",
          errorLoading: "Error loading queues:",
          unknownError: "Unknown error",
          queueName: "Queue Name",
          priority: "Priority",
          timeLimits: "Time Limits",
          jobs: "Jobs",
          status: "Status",
          noQueuesFound: "No enabled and started queues found",
        },
        language: {
          english: "English",
          czech: "Čeština",
          switchLanguage: "Switch Language",
        },
      },
    },
    cs: {
      translation: {
        pages: {
          personalView: "Můj Přehled",
          qsubAssembler: "Sestavovač úloh (qsub)",
          machines: "Servery MetaCentra",
          jobs: "Úlohy",
          queues: "Fronty úloh",
          propertiesOfMachines: "Vlastnosti strojů",
          users: "Uživatelé mych skupin",
          resourceStatus: "Stav zdroju",
          storageSpaces: "Uložné prostory",
          waitingJobs: "Čekajíci úlohy",
          outages: "Výpadky",
          currentStatus: "Aktualní stav",
          userSupport: "Uživatelská podpora",
          documentation: "Dokumentace",
          faq: "FAQ",
          metacentrum: "Metacentrum.cz",
        },
        queues: {
          routeQueue: "Směrovací fronta",
          noAccess:
            "Přístup k této frontě je vyhrazen autorizovaným uživatelům",
          min: "Min",
          max: "Max",
          enabled: "Povoleno",
          disabled: "Zakázáno",
          started: "Spuštěno",
          stopped: "Zastaveno",
          loading: "Načítání front...",
          errorLoading: "Chyba při načítání front:",
          unknownError: "Neznámá chyba",
          queueName: "Název fronty",
          priority: "Priorita",
          timeLimits: "Časové limity",
          jobs: "Úlohy",
          status: "Stav",
          noQueuesFound: "Nebyly nalezeny žádné povolené a spuštěné fronty",
        },
        language: {
          english: "English",
          czech: "Čeština",
          switchLanguage: "Přepnout jazyk",
        },
      },
    },
  },
  lng: savedLanguage,
  fallbackLng: "cs",
  interpolation: { escapeValue: false },
});

// Persist language changes to localStorage
i18n.on("languageChanged", (lng) => {
  localStorage.setItem("i18nextLng", lng);
});
