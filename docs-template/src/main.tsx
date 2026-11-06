import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { MDXProvider } from "@mdx-js/react";
import App from "./App";
import { CodeBlock } from "./components/code-block";
import { Callout } from "./components/callout";
import { BrandingProvider } from "./branding";
import "./globals.css";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <MDXProvider components={{ pre: CodeBlock, blockquote: Callout }}>
        <BrandingProvider>
          <App />
        </BrandingProvider>
      </MDXProvider>
    </BrowserRouter>
  </StrictMode>,
);
