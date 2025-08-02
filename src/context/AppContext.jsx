import { createContext, useState } from 'react';
import PropTypes from 'prop-types';

export const AppContext = createContext();

export const AppProvider = ({ children }) => {
    const [controlData, setControlData] = useState([]);
    const [routeChange, setRouteChange] = useState(false);

    return (
        <AppContext.Provider value={{ controlData, setControlData , routeChange, setRouteChange}}>
            {children}
        </AppContext.Provider>
    );
};

AppProvider.propTypes = {
    children: PropTypes.node.isRequired,
};
