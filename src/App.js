import { useState, useEffect } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import * as XLSX from "xlsx";


import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});


const initialData = [
  { id: "1", name: "Ahmet", surname: "Yılmaz", gsm: "05555555555", address: "Pilkington Avenue" },
  { id: "2", name: "Mehmet", surname: "Demir", gsm: "05443332211", address: "Kingston Road" },
  { id: "3", name: "Ayşe", surname: "Kara", gsm: "05321234567", address: "Baker Street" },
  { id: "4", name: "Fatma", surname: "Çelik", gsm: "05061239876", address: "Oxford Street" },
  { id: "5", name: "Ali", surname: "Şahin", gsm: "05519876543", address: "Cambridge Avenue" },
];

function App() {
  const [name, setName] = useState("");
  const [surname, setSurname] = useState("");
  const [gsm, setGSM] = useState("");
  const [address, setAddress] = useState("");
  const [editId, setEditId] = useState(null);
  const [data, setData] = useState(() => {
    const items = localStorage.getItem("userData");
    return items ? JSON.parse(items) : initialData;
  });
  const [route, setRoute] = useState([]);
  const [startId, setStartId] = useState("");
  const [endId, setEndId] = useState("");

  useEffect(() => {
    localStorage.setItem("userData", JSON.stringify(data));
  }, [data]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === "name") setName(value);
    if (name === "surname") setSurname(value);
    if (name === "gsm") setGSM(value);
    if (name === "address") setAddress(value);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name || !surname || !gsm || !address) {
      alert("Hiçbir alan boş kalmamalı");
      return;
    }

    if (editId) {
      const update = data.map((item) =>
        item.id === editId ? { ...item, name, surname, gsm, address } : item
      );
      setData(update);
      setEditId(null);
    } else {
      setData([
        ...data,
        {
          id: crypto.randomUUID(),
          name,
          surname,
          gsm,
          address,
        },
      ]);
    }

    setName("");
    setSurname("");
    setGSM("");
    setAddress("");
  };

  const handleDelete = (id) => {
    const filter = data.filter((item) => item.id !== id);
    setData(filter);
  };

  const handleEdit = (item) => {
    setEditId(item.id);
    setName(item.name);
    setSurname(item.surname);
    setGSM(item.gsm);
    setAddress(item.address);
  };

  async function handleGeocode(id) {
    const findItem = data.find((i) => i.id === id);
    if (!findItem) return;

    try {
      const encode = encodeURIComponent(findItem.address);
      const url = `https://nominatim.openstreetmap.org/search?q=${encode}&format=jsonv2&limit=1`;
      const res = await fetch(url);
      const resData = await res.json();
      const { lat, lon } = resData[0];
      const newData = data.map((item) =>
        item.id === id ? { ...item, lat: Number(lat), lon: Number(lon) } : item
      );
      setData(newData);
    } catch (err) {
      console.error(err);
    }
  }

  const handleExcel = () => {
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Kullanıcılar");
    XLSX.writeFile(wb, "kullanicilar.xlsx");
  };

  async function handleRoute() {
    if (!startId || !endId) return alert("Başlangıç ve bitiş seçiniz");

    const start = data.find((x) => x.id === startId);
    const end = data.find((x) => x.id === endId);
    try {
      const key = "59f14b7f-4bc2-4c48-ac35-2d8ee00b7854";
      const url = `https://graphhopper.com/api/1/route?key=${key}`;
      const body = {
        points: [
          [start.lon, start.lat],
          [end.lon, end.lat],
        ],
        vehicle: "car",
        locale: "tr",
        calc_points: true,
        points_encoded: false,
      };

      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const json = await res.json();
      console.log(json)
      if (!json.paths || !json.paths[0]) {
        alert("Rota alınamadı");
        return;
      }

      const points = json.paths[0].points.coordinates.map(([lon, lat]) => [lat, lon]);
     
      setRoute(points);
      
    } catch (err) {
      console.log("Rota oluşturulurken hata:", err);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 to-blue-50 p-5">
      <div className="flex flex-col lg:flex-row w-full justify-start mt-5 gap-6">
  
        <form
          className="shadow-xl p-6 rounded-2xl bg-white flex flex-col gap-3 flex-1 transition-transform hover:scale-[1.01]"
          onSubmit={handleSubmit}
        >
          <legend className="text-xl font-semibold text-blue-700 mb-2">
            {editId ? "Kayıt Düzenle" : "Kayıt Ekle"}
          </legend>

          
          <input
            type="text"
            name="name"
            placeholder="isminizi giriniz"
            value={name}
            onChange={handleInputChange}
            className="border px-2 py-1"
          />
          <input
            type="text"
            name="surname"
            placeholder="soyisminizi giriniz"
            className="border px-2 py-1"
            value={surname}
            onChange={handleInputChange}
          />
          <input
            type="text"
            name="gsm"
            placeholder="gsm"
            className="border px-2 py-1"
            value={gsm}
            onChange={handleInputChange}
          />
          <input
            type="text"
            name="address"
            placeholder="adresinizi giriniz"
            className="border px-2 py-1"
            value={address}
            onChange={handleInputChange}
          />


          <button
            className="mt-2 border px-3 py-2 bg-blue-600 text-white rounded-lg font-medium 
            hover:bg-blue-700 hover:shadow-md transition-all duration-200 transform hover:scale-105"
          >
            {editId ? "Güncelle" : "Ekle"}
          </button>
        </form>

     
        <div className="flex flex-col flex-1 w-full overflow-x-auto rounded-xl bg-white shadow-lg">
          <div className="grid grid-cols-8 gap-2 border-b p-2 font-semibold bg-blue-100 text-blue-800 text-sm text-center">
            <p>ID</p>
            <p>Ad</p>
            <p>Soyad</p>
            <p>Gsm</p>
            <p>Adres</p>
            <p>Lat</p>
            <p>Lon</p>
            <p>İşlemler</p>
          </div>

          {data.map((item) => {
            const { name, surname, gsm, address, id, lat, lon } = item;
            return (
              <div
                key={id}
                className="grid grid-cols-8 gap-6 p-2 text-sm items-center text-center border-b hover:bg-blue-50 transition"
              >
                <p className="truncate">{id}</p>
                <p className="truncate">{name}</p>
                <p className="truncate">{surname}</p>
                <p className="truncate">{gsm}</p>
                <p className="truncate">{address}</p>
                <p className="truncate">{lat}</p>
                <p className="truncate">{lon}</p>
                <div className="flex gap-1 justify-center flex-wrap">
                  <button
                    onClick={() => handleEdit(item)}
                    className="bg-yellow-400 text-white px-2 py-1 rounded text-xs hover:bg-yellow-500 transition-all duration-200 transform hover:scale-105"
                  >
                    Düzenle
                  </button>
                  <button
                    onClick={() => handleGeocode(id)}
                    className="px-2 py-1 bg-green-500 rounded text-xs text-white hover:bg-green-600 transition-all duration-200 transform hover:scale-105"
                  >
                    Geocode
                  </button>
                  <button
                    onClick={() => handleDelete(id)}
                    className="bg-red-500 text-white px-2 py-1 rounded text-xs hover:bg-red-600 transition-all duration-200 transform hover:scale-105"
                  >
                    Sil
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>


      <div className="mt-6 flex flex-col sm:flex-row items-start sm:items-center gap-3 bg-white p-4 rounded-xl shadow-md">
        <button
          onClick={handleExcel}
          className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 hover:shadow-md transition-all duration-200 transform hover:scale-105"
        >
          Excel'e Aktar
        </button>

        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <select
            className="border px-3 py-2 rounded-lg focus:ring-2 focus:ring-blue-400 outline-none transition-all duration-200"
            value={startId}
            onChange={(e) => setStartId(e.target.value)}
          >
            <option value="">Başlangıç Noktası</option>
            {data
              .filter((x) => x.lat && x.lon)
              .map((x) => (
                <option key={x.id} value={x.id}>
                  {x.name} {x.surname}
                </option>
              ))}
          </select>

          <select
            className="border px-3 py-2 rounded-lg focus:ring-2 focus:ring-blue-400 outline-none transition-all duration-200"
            value={endId}
            onChange={(e) => setEndId(e.target.value)}
          >
            <option value="">Bitiş Noktası</option>
            {data
              .filter((x) => x.lat && x.lon)
              .map((x) => (
                <option key={x.id} value={x.id}>
                  {x.name} {x.surname}
                </option>
              ))}
          </select>

          <button
            onClick={handleRoute}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 hover:shadow-md transition-all duration-200 transform hover:scale-105"
          >
            Rota Oluştur
          </button>
        </div>
      </div>

   
      <div className="mt-6">
        <h2 className="text-lg font-semibold mb-3 text-blue-700">🗺️ Kişiler Haritası</h2>
        <div className="w-full h-[400px] rounded-2xl overflow-hidden shadow-lg border border-blue-200">
          <MapContainer
            center={[39.9255, 32.8663]}
            zoom={6}
            style={{ height: "100%", width: "100%" }}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution="&copy; OpenStreetMap contributors"
            />
            {data.filter((x) => x.lat && x.lon).map((x) => (
              <Marker key={x.id} position={[x.lat, x.lon]}>
                <Popup>
                  <strong>
                    {x.name} {x.surname}
                  </strong>
                  <br />
                  {x.address}
                </Popup>
              </Marker>
            ))}
            {route.length > 0 && <Polyline positions={route} color="red" />}
          </MapContainer>
        </div>
      </div>
    </div>
  );
}

export default App;
