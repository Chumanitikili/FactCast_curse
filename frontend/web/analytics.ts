import ReactGA from 'react-ga4';
ReactGA.initialize('G-XXXXXXXXXX');
export function trackPage(page:string) {
  ReactGA.send({ hitType: "pageview", page });
}
