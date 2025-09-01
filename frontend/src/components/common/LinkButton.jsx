import React from "react";
import { Button } from "react-bootstrap";
import { useNavigate } from "react-router-dom";

const LinkButton = ({ to, children, ...buttonProps }) => {
  const navigate = useNavigate();

  const handleClick = (e) => {
    e.preventDefault();
    navigate(to);
  };

  return (
    <Button {...buttonProps} onClick={handleClick}>
      {children}
    </Button>
  );
};

export default LinkButton;
