import { useEffect, useState } from 'react';
import { AgCharts } from 'ag-charts-react';
import './DashBoard.css';
import { backend_url } from "../../App";
import { Link } from 'react-router-dom'


import NombreDeVisit from "./Graphique/NombreDeVisit";
import CompteActifs from "./Graphique/CompteActifs";
import VendusAddPanier from "./Graphique/VendusAddPanier";
import ChiffreAffaire from "./Graphique/ChiffreAffaire";
import CAcategorie from "./Graphique/CAcategorie";



const DashBoard = () => {
  return (
    <>
      <div className="dashboard">
        <h1>Tableau de Bord</h1>

        <div className="chart">
          <NombreDeVisit/>
        </div>

        <div className="chart">
          <CompteActifs/>
        </div>

        <div className="chart">
          <VendusAddPanier/>
        </div>

        <div className="chart">
          <ChiffreAffaire/>
        </div>
        
        <div className="chart">
          <CAcategorie/>
        </div>
      </div>
    </>
  );
};

export default DashBoard;
