/* eslint-disable @typescript-eslint/no-explicit-any */
import { BrowserHistory, createBrowserHistory } from 'history';
import React from 'react';
import {
  Location,
  NavigateFunction,
  Params,
  useLocation,
  useNavigate,
  useParams,
} from 'react-router-dom';

export const timeFormat = (timestamp: string) => {
    const t = new Date(timestamp); 
    return `${t.toLocaleDateString()} - ${t.toLocaleTimeString()}`;
}

export interface WithRoutes {
  router: {
    location: Location;
    navigate: NavigateFunction;
    params: Readonly<Params<string>>;
    history: BrowserHistory;
  };
}

export function withRouter(Component: any) {
  function ComponentWithRouterProp(props: any) {
    const location = useLocation();
    const navigate = useNavigate();
    const params = useParams();
    const history = createBrowserHistory();

    return (
      <Component {...props} router={{ location, navigate, params, history }} />
    );
  }

  return ComponentWithRouterProp;
}
