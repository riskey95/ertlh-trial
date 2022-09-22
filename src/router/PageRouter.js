import React, { useEffect, useState } from "react";
import { HashRouter, Route, Routes } from "react-router-dom";
import Dashboard from "../views/Dashboard";
import Login from "../views/Login";



function PageRouter(props) {
    return (
        <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<Dashboard />} />
        </Routes>

    );
}

export default (PageRouter)