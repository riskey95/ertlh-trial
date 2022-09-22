import { collection, doc, getDocs, query, updateDoc, where, orderBy, limit } from 'firebase/firestore'
import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { db } from '../firebase'
import { MapContainer, TileLayer, useMap, Marker, Popup } from 'react-leaflet';


function Dashboard() {

    const [state, setState] = useState({
        input: { kecamatan: '', desa: '', field: 'nama', key: '', nama: '', alamat: '' },
        kecamatan: {},
        desa: [],
        survei: {},
        disetujui: 0,
        ditolak: 0,
        usulan: 0,
        selected: ''
    })
    const [loginMsg, setLoginMsg] = useState('')
    const navigate = useNavigate()
    const [loading, setLoading] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [showConfirmAction, setShowConfirmAction] = useState(false);
    const [action, setAction] = useState(false);

    document.title = "Dashboard E RTLH"

    useEffect(() => {
        if (!localStorage.getItem('uid')) {
            navigate(`/login`)
        }
    })

    useEffect(() => {
        loadKecamatan()
    }, [])

    useEffect(() => {
        if ((typeof state.input.kecamatan !== 'undefined') && state.input.kecamatan.length > 0) {
            loadDesa()
            loadSurvei()
        }
    }, [state.input.kecamatan])

    const handleChange = (e) => {
        const { name, value } = e.target;
        setState(prevState => ({
            ...prevState,
            input: {
                ...prevState.input,
                [name]: value
            }
        }))
    }

    const loadKecamatan = () => {
        let q = query(collection(db, 'kecamatan'));

        if (localStorage.getItem('kecamatan')) {
            q = query(q, where('__name__', '==', localStorage.getItem('kecamatan')))
        }

        const querySnapshot = getDocs(q);
        querySnapshot.then((docs) => {
            let datas = {}
            docs.forEach((doc) => {
                datas[doc.id] = doc.data()
            })
            setState(prevState => ({
                ...prevState,
                kecamatan: datas
            }))


            if (localStorage.getItem('kecamatan')) {
                setState(prevState => ({
                    ...prevState,
                    input: {
                        ...prevState.input,
                        kecamatan: localStorage.getItem('kecamatan')
                    }
                }))
            }

        })
    }

    const loadDesa = () => {
        let desa = state.kecamatan[state.input.kecamatan].desa;
        console.log(desa)
        setState(prevState => ({
            ...prevState,
            desa: desa
        }))
    }

    const loadSurvei = () => {
        setLoading(true)
        let q = query(
            collection(db, 'survey'),
            where('kecamatan', '==', state.input.kecamatan),
			orderBy('status', 'desc'),
			//limit(10)
			//orderBy('status')
        )

        if (state.input.desa.length > 0) q = query(q, where('desa', '==', state.input.desa))
        // if (state.input.field.length > 0) q = query(q, where(state.input.field, '>=', state.input.key), where(state.input.field, '<=', state.input.key + '\uf8ff'))
        if (state.input.nama.length > 0) q = query(q, where('nama', '>=', state.input.nama), where('nama', '<=', state.input.nama + '\uf8ff'))
        if (state.input.alamat.length > 0) q = query(q, where('alamat', '>=', state.input.alamat), where('alamat', '<=', state.input.alamat + '\uf8ff'))

        const querySnapshot = getDocs(q);
        querySnapshot.then((docs) => {
            let datas = {}
            let disetujui = 0, ditolak = 0, usulan = 0;

            docs.forEach((doc) => {
                datas[doc.id] = doc.data()
                usulan += 1;
                if (doc.data().status === 'Ditolak') {
                    ditolak += 1;
                } else if (doc.data().status === 'Disetujui') {
                    disetujui += 1;
                }
            })
            setState(prevState => ({
                ...prevState,
                survei: datas,
                disetujui: disetujui,
                ditolak: ditolak,
                usulan: usulan
            }))
            setLoading(false)
        }).catch((error) => {
  console.error(error);
});
    }


    const submit = (e) => {
        e.preventDefault()
        loadSurvei()
    }

    const myref = useRef(null)

    const openModal = (e) => {
        const id = e.currentTarget.getAttribute('data-id')
        if (id) {
            myref.current = id;
            setShowModal(true);
        }
        // setState(prevState => ({
        //     ...prevState,
        //     selected: (state.survei[id]) ? state.survei[id] : {}
        // }))
    }

    const handleConfirm = (action) => {
        setShowConfirmAction(true)
        setAction(action)
    }

    const submitStatus = () => {
        const toupdateRef = doc(db, "survey", state.survei[myref.current].serverUid)
        const updated = updateDoc(toupdateRef, {
            status: (action) ? 'Disetujui' : 'Ditolak'
        });

        updated.then((val) => {
            setShowModal(false)
            loadSurvei()
        })
    }

    const handleLogout = () => {
        localStorage.removeItem('uid')
        localStorage.removeItem('kecamatan')
        setTimeout(() => {
            navigate(`/login`)
        }, 1400)

    }

    const isVerifikator = () => {
        if (localStorage.getItem('role') === 'verifikator') {
            return true
        }
        return false
    }

    const downloadTable = () => {
        let row = [];
        Object
            .keys(state.survei)
            .map((key) => {
                row.push(state.survei[key])
            })
        makeCsv(row, "Export E RTLH Kab Bojonegoro.csv")

    }


    const makeCsv = async (rows, filename) => {
        const separator = ';';
        const keys = Object.keys(rows[0]);

        const csvContent = `${keys.join(separator)}\n${rows.map((row) => keys.map((k) => {
            let cell = row[k] === null || row[k] === undefined ? '' : row[k];

            cell = cell instanceof Date
                ? cell.toLocaleString()
                : cell.toString().replace(/"/g, '""');

            if (cell.search(/("|,|\n)/g) >= 0) {
                cell = `"${cell}"`;
            }
            return cell;
        }).join(separator)).join('\n')}`;

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        if (navigator.msSaveBlob) { // In case of IE 10+
            navigator.msSaveBlob(blob, filename);
        } else {
            const link = document.createElement('a');
            if (link.download !== undefined) {
                // Browsers that support HTML5 download attribute
                const url = URL.createObjectURL(blob);
                link.setAttribute('href', url);
                link.setAttribute('download', filename);
                link.style.visibility = 'hidden';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            }
        }
    };

    return (
        <div className='dashboard'>
            <div className='container'>
                <div className='d-flex mb-5'>
                    <div>
                        <i className='icon bi-incognito'></i> User <strong>{localStorage.getItem('username')}</strong> | Kecamatan <strong>{localStorage.getItem('kecamatan')}</strong> | Level <strong>{localStorage.getItem('role') ? localStorage.getItem('role') : 'Admin'}</strong>
                    </div>
                    <div className='me-0 ms-auto'>
                        <span onClick={handleLogout} className="btn badge bg-danger"><i className='icon bi-door-open'></i> Logout</span>
                    </div>
                </div>
                <div className='card mb-5 bg-dark text-light'>
                    <div className='row'>
                        <div className='col-12 col-lg-4'>
                            <div className='card-body border-right'>
                                <div className='d-flex align-items-center justify-content-center'>
                                    <div className='h2 me-3 display-4'><i className='icon bi-chat-dots'></i></div>
                                    <div className='h4 text-uppercase'>Usulan</div>
                                    <div className='ms-3'><h2 className='text-warning display-4'>{state.usulan}</h2></div>
                                </div>
                            </div>
                        </div>
                        <div className='col-12 col-lg-4'>
                            <div className='card-body border-right'>
                                <div className='d-flex align-items-center justify-content-center'>
                                    <div className='h2 me-3 display-4'><i className='icon bi-check-all'></i></div>
                                    <div className='h4 text-uppercase'>Disetujui</div>
                                    <div className='ms-3'><span className='font-weight-bold text-success display-4'>{state.disetujui}</span></div>
                                </div>
                            </div>
                        </div>
                        <div className='col-12 col-lg-4'>
                            <div className='card-body border-right'>
                                <div className='d-flex align-items-center justify-content-center'>
                                    <div className='h2 me-3 display-4'><i className='icon bi-exclamation'></i></div>
                                    <div className='h4 text-uppercase'>Ditolak</div>
                                    <div className='ms-3'><h2 className='text-danger display-4'>{state.ditolak}</h2></div>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
                <div className='card mb-5'>
                    <div className='card-body'>
                        <p>Filter</p>
                        <form onSubmit={submit}>
                            <div className='form-group row'>
                                <div className='col-12 col-md-2'>
                                    <input placeholder='Input nama...' name="nama" className="form-control" onChange={handleChange} value={state.input.nama} />
                                </div>
                                <div className='col-12 col-md-2'>
                                    <input placeholder='Input alamat...' name="alamat" className="form-control" onChange={handleChange} value={state.input.alamat} />
                                </div>
                                <div className='col-12 col-md-3'>
                                    <select name='kecamatan' className="form-control form-select" onChange={handleChange} value={state.input.kecamatan}>
                                        <option value="">- pilih kecamatan -</option>
                                        {
                                            Object.keys(state.kecamatan).map((kec) => {
                                                return <option value={kec}>{kec}</option>
                                            })
                                        }
                                    </select>
                                </div>
                                <div className='col-12 col-md-3'>
                                    <select name='desa' className="form-control form-select" onChange={handleChange} value={state.input.desa}>
                                        <option value="">- pilih desa -</option>
                                        {
                                            state.desa.map((val) => {
                                                return <option value={val}>{val}</option>
                                            })
                                        }
                                    </select>
                                </div>
                                <div className='col-12 col-md-1'>
                                    <div className='d-flex'>
                                        <button type='submit' className='btn btn-warning'><i className='icon bi-filter'></i></button>
                                        <button onClick={downloadTable} className='ms-2 btn btn-info'><i className='icon bi-download'></i></button>
                                    </div>
                                </div>
                            </div>
                        </form>

                    </div>
                </div>
                <div className='card mb-3'>
                    <div className='card-body'>
                        {
                            loading && <p>Loading data survey....</p>
                        }
                        {
                            !loading && <table className='table table-striped table-hovered'>
                                <thead>
                                    <tr>
                                        <th>Nama</th>
                                        <th>NIK</th>
                                        <th>Desa</th>
                                        <th>Alamat</th>
                                        <th>Status</th>
                                        <th>Aksi</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {
                                        Object
                                            .keys(state.survei)
                                            .map((key) => {
                                                return <tr>
                                                    <td>{state.survei[key].nama}</td>
                                                    <td>{state.survei[key].nik}</td>
                                                    <td>{state.survei[key].desa}</td>
                                                    <td>{state.survei[key].alamat}</td>
                                                    <td>{state.survei[key].status}</td>
                                                    <td><button onClick={openModal} data-id={key} className='btn btn-outline-primary btn-sm'><i className='icon bi-search'></i> Detail</button></td>
                                                </tr>
                                            })
                                    }
                                </tbody>
                            </table>
                        }

                    </div>
                </div>

            </div>
            {
                showModal && <div className={`modal fade ${showModal ? 'show' : ''}`} id="modal-detail" style={showModal ? { display: 'block' } : { display: 'none' }}>
                    <div className="modal-dialog modal-xl">
                        <div className="modal-content">
                            <div className="modal-header bg-dark text-light">
                                <h4 className="modal-title">Detail Usulan</h4>
                            </div>
                            <div className="modal-body">
                                <div className='row'>
                                    <div className='col-12 col-md-3'>
                                        <p className='mb-1'><small><strong>Nama</strong></small></p>
                                        <p className='mb-1'>{state.survei[myref.current].nama}</p>
                                        <p className='mb-1'><small><strong>NIK</strong></small></p>
                                        <p className='mb-1'>{state.survei[myref.current].nik}</p>
                                        <p className='mb-1'><small><strong>No KK</strong></small></p>
                                        <p className='mb-1'>{state.survei[myref.current].noKK}</p>
                                    </div>
                                    <div className='col-12 col-md-3'>
                                        <p className='mb-1'><small><strong>Jml KK</strong></small></p>
                                        <p className='mb-1'>{state.survei[myref.current].jumlahKK}</p>
                                        <p className='mb-1'><small><strong>Jml Penghuni</strong></small></p>
                                        <p className='mb-1'>{state.survei[myref.current].jumlahPenghuni}</p>
										<p className='mb-1'><small><strong>Penilaian Sistem</strong></small></p>
                                        <p className='mb-1'>{state.survei[myref.current].nilai}</p>
                                    </div>
                                    <div className='col-12 col-md-3'>
                                        <p className='mb-1'><small><strong>Alamat</strong></small></p>
                                        <p className='mb-1'>{state.survei[myref.current].alamat}</p>
                                        <p className='mb-1'><small><strong>Desa</strong></small></p>
                                        <p className='mb-1'>{state.survei[myref.current].desa}</p>
                                        <p className='mb-1'><small><strong>Kecamatan</strong></small></p>
                                        <p className='mb-1'>{state.survei[myref.current].kecamatan}</p>
                                    </div>
                                    <div className='col-12 col-md-3'>
										<p className='mb-1'><small><strong>Lat</strong></small></p>
                                        <p className='mb-1'>{state.survei[myref.current].latitude}</p>
                                        <p className='mb-1'><small><strong>Lng</strong></small></p>
                                        <p className='mb-1'>{state.survei[myref.current].longitude}</p>
                                    </div>
                                </div>
                                <div className='row'>
                                    <div className='col-12 col-md-4'>
                                        <p className='mb-1'><small><strong>Foto KTP</strong></small></p>
                                        <img src={state.survei[myref.current].foto_ktp} className='img-fluid' />
                                    </div>
                                    <div className='col-12 col-md-4'>
                                        <p className='mb-1'><small><strong>Foto Dalam Rumah</strong></small></p>
                                        <img src={state.survei[myref.current].foto_dalamRumah} className='img-fluid' />
                                    </div>
                                    <div className='col-12 col-md-4'>
                                        <p className='mb-1'><small><strong>Foto Samping</strong></small></p>
                                        <img src={state.survei[myref.current].foto_samping} className='img-fluid' />
                                    </div>
                                </div>
                                <div className='row'>
                                    <div className='col-12 col-md-3'>

                                    </div>
                                </div>
                            </div>
                            <div className="modal-footer justify-content-between bg-dark">
                                {
                                    !showConfirmAction && <>
                                        <button type="button" className="btn btn-outline-warning" data-dismiss="modal" onClick={() => setShowModal(false)}>Close</button>
                                        {
                                            isVerifikator()
                                            && <>

                                                <div>
                                                    {
                                                        ((['Disetujui', 'Ditolak']).indexOf(state.survei[myref.current].status) < 0)
                                                        && <>


                                                            <button type="button" className="btn btn-danger" onClick={() => handleConfirm(0)}>Ditolak</button>
                                                            <button type="button" className="btn btn-primary ms-2" onClick={() => handleConfirm(1)}>Disetujui</button>

                                                        </>
                                                    }
                                                </div>
                                            </>
                                        }
                                    </>
                                }
                                {
                                    showConfirmAction && isVerifikator && <>
                                        <p>Yakin akan <strong>{action ? <span className='text-primary h3'>Disetujui</span> : <span className='text-danger h3'>Ditolak</span>}</strong> usulan ini?</p>
                                        <div>
                                            <button type="button" className="btn btn-success" onClick={submitStatus}>Ya, Simpan</button>
                                            <button type="button" className="btn btn-outline-info ms-2" data-dismiss="modal" onClick={() => { setShowConfirmAction(false); setShowModal(false) }}>Batal</button>

                                        </div>
                                    </>
                                }


                            </div>
                        </div>
                    </div>
                </div>
            }

        </div>
    )
}

export default (Dashboard)