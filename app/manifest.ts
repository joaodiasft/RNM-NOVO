import type { MetadataRoute } from "next";

/**
 * PWA manifest — o sistema já pode ser instalado na tela inicial do
 * celular como um app. Também é a base para o futuro app mobile
 * (React Native/Expo reaproveita 100% da API deste projeto).
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "redacao-nota-mil",
    name: "Redação Nota Mil",
    short_name: "RNM",
    description:
      "Gestão acadêmica da Redação Nota Mil — frequência, redações, financeiro e avisos.",
    start_url: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#f5f6fa",
    theme_color: "#0f172a",
    lang: "pt-BR",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
    ],
  };
}
