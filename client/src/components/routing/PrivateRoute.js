import React from "react";
import { Route, Navigate } from "react-router-dom";
import PropTypes from "prop-types";
import { connect } from "react-redux";

const PrivateRoute = ({ auth: { isAuthenticated, loading }, children }) => {
  if (!isAuthenticated && !loading) {
    return <Navigate to="/login" />;
  }
  return children;
};

PrivateRoute.propTypes = {
  auth: PropTypes.object.isRequired,
};

const mapStateToProps = (state) => ({
  auth: state.auth,
});

export default connect(mapStateToProps)(PrivateRoute);
