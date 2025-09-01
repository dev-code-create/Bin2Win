import React from "react";

const IconWrapper = ({ icon: Icon, size = 16, className = "", style = {} }) => {
  return <Icon size={size} className={className} style={style} />;
};

export default IconWrapper;
