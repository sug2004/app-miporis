import { StaticRouter } from 'react-router-dom/server';
import { renderToString } from 'react-dom/server'
import App from './App'
import { AppProvider } from './context/AppContext';

export function render(url) {
  const html = renderToString(
    <StaticRouter location={url}>
      <AppProvider>
        <App />
      </AppProvider>
    </StaticRouter>
  )
  return { html }
}

