import { useState, useEffect } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import * as XLSX from "xlsx";

const initialData = [
  {
    id: "1",
    name: "Ahmet",
    surname: "Yılmaz",
    gsm: "05555555555",
    address: "Pilkington Avenue",
  },
  {
    id: "2",
    name: "Mehmet",
    surname: "Demir",
    gsm: "05443332211",
    address: "Kingston Road",
  },
  {
    id: "3",
    name: "Ayşe",
    surname: "Kara",
    gsm: "05321234567",
    address: "Baker Street",
  },
  {
    id: "4",
    name: "Fatma",
    surname: "Çelik",
    gsm: "05061239876",
    address: "Oxford Street",
  },
  {
    id: "5",
    name: "Ali",
    surname: "Şahin",
    gsm: "05519876543",
    address: "Cambridge Avenue",
  },
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
      if (!resData[0]) return alert("Adres bulunamadı");

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

  // 🔹 GraphHopper rota oluşturma (hatalara karşı güvenli)
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
      console.log("GraphHopper yanıtı:", json);

      if (!json.paths || !json.paths[0]) {
        alert(
          "Rota alınamadı. API limitine ulaşılmış olabilir veya adresler çok uzak."
        );
        return;
      }

      const points = json.paths[0].points.coordinates.map(([lon, lat]) => [
        lat,
        lon,
      ]);
      setRoute(points);
    } catch (err) {
      console.error("Rota oluşturulurken hata:", err);
      alert("Rota oluşturulurken hata oluştu. Konsolu kontrol edin.");
    }
  }

  return (
    <div className="">
      <div className="flex w-full items-center justify-start mt-5 ">
        <form
          className="shadow-xl p-5 rounded flex flex-col gap-2 flex-1"
          onSubmit={handleSubmit}
        >
          <legend>{editId ? "Kayıt Düzenle" : "Kayıt Ekle"}</legend>

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
          <button className="border px-3 py-1 bg-blue-500 text-white">
            {editId ? "Güncelle" : "Ekle"}
          </button>
        </form>

        <div className="flex flex-col flex-5">
          <div className="flex justify-between border py-2 font-bold">
            <p>Id</p>
            <p>Ad</p>
            <p>Soyad</p>
            <p>Gsm</p>
            <p>Address</p>
            <p>Lat</p>
            <p>Lon</p>
            <p>İşlemler</p>
          </div>

          {data.map((item) => {
            const { name, surname, gsm, address, id, lat, lon } = item;
            return (
              <div
                key={id}
                className="flex w-full justify-between border py-2 items-center"
              >
                <p className="flex-1">{id}</p>
                <p className="flex-1">{name}</p>
                <p className="flex-1">{surname}</p>
                <p className="flex-1">{gsm}</p>
                <p className="flex-1">{address}</p>
                <p className="flex-1">{lat}</p>
                <p className="flex-1">{lon}</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(item)}
                    className="bg-yellow-400 text-white px-2 py-1 rounded"
                  >
                    Düzenle
                  </button>
                  <button
                    onClick={() => handleGeocode(id)}
                    className="px-2 py-1 bg-green-400 rounded text-sm text-white"
                  >
                    Geocode
                  </button>
                  <button
                    onClick={() => handleDelete(id)}
                    className="bg-red-500 text-white px-2 py-1 rounded"
                  >
                    Sil
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <button
        onClick={handleExcel}
        className="mt-3 px-3 py-1 bg-purple-600 text-white rounded"
      >
        Excel'e Aktar
      </button>

      <div className="mt-4 flex items-center gap-2">
        <select
          className="border px-2 py-1"
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
          className="border px-2 py-1"
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
          className="bg-blue-600 text-white px-3 py-1 rounded"
        >
          Rota Oluştur
        </button>
      </div>

      <div className="mt-5">
        <h2 className="text-lg font-semibold mb-2">Kişiler Haritası</h2>
        <MapContainer
          center={[39.9255, 32.8663]}
          zoom={6}
          style={{ height: "400px", width: "100%" }}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution="&copy; OpenStreetMap contributors"
          />
          {data
            .filter((x) => x.lat && x.lon)
            .map((x) => (
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
  );
}

export default App;
