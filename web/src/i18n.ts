import i18n from "i18next";
import { initReactI18next } from "react-i18next";

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
      },
    },
  },
  lng: "cs",
  fallbackLng: "cs",
  interpolation: { escapeValue: false },
});
