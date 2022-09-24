import { collection, doc, getDoc, getDocs, onSnapshot, query, where } from "firebase/firestore";
import React, { useEffect, useState } from "react"
import { db, auth } from "../firebase";
import { useNavigate } from "react-router-dom";
import logo from "../kab_bojonegoro.png";
import { signInWithEmailAndPassword } from "firebase/auth";

function Login() {

    const [state, setState] = useState({
        input: {}
    })
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")


    const [loginMsg, setLoginMsg] = useState('')
    const navigate = useNavigate()

    useEffect(() => {
        if (localStorage.getItem('uid')) {
            navigate(`/`)
        }
    })


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

    const handleLogin = (e) => {
        e.preventDefault()

        signInWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {
            // Signed in 
            const user = userCredential.user;
            const docRef = doc(db, 'users', user.uid);
            getDoc(docRef).then(docSnap =>{
                Object.keys(docSnap.data()).map((dockey) => {
                    localStorage.setItem(dockey, docSnap.data()[dockey])
                })
                navigate(`/`)
            });
        })
        .catch((error) => {
            setLoginMsg("Kombinasi username dan password tidak tepat.")
            const errorCode = error.code;
            const errorMessage = error.message;
            console.log(errorCode)
            console.log(errorMessage)

            // ..
        });

    }

    const submit = (e) => {
        setLoginMsg('')
        e.preventDefault();
        const q = query(collection(db, 'users'), where("email", "==", email))
        const querySnapshot = getDocs(q);
        querySnapshot.then((docs) => {
            if (docs.empty) {
                setLoginMsg("Kombinasi username dan password tidak tepat.")
            } else {
                docs.forEach((doc) => {
                    Object.keys(doc.data()).map((dockey) => {
                        localStorage.setItem(dockey, doc.data()[dockey])
                    })
                });
                navigate(`/`)
            }
        })
    }

    return (
        <section class="d-flex align-items-center my-5 mt-lg-6 mb-lg-5">
            <div className="container">
                <div className="justify-content-center">
                    <div className="d-flex align-items-center justify-content-center col-12">
                        <div className="bg-white shadow-soft border rounded border border-light p-4 p-lg-5 w-100 fmxw-500 login-area">
                            <img src={logo} className="col-6 col-lg-3 img-fluid" />
                            <div className="my-4">
                                <h1>Login</h1>
                                <p>Dashboard Verifikasi e-RTLH</p>
                            </div>
                            <div className="mb-4">
                                <p>{loginMsg}</p>
                                <form onSubmit={handleLogin}>
                                    <div className="form-group">
                                        <div className="input-group">
                                            <div className="input-group-prepend">
                                                <span className="input-group-text"><i className="icon bi-envelope"></i></span>
                                            </div>                                            
                                            <input name="email" className="form-control" onChange={e=>setEmail(e.target.value)} />
                                        </div>
                                    </div>
                                    <div className="form-group">
                                        <div className="input-group">
                                            <div className="input-group-prepend">
                                                <span className="input-group-text"><i className="icon bi-key"></i></span>
                                            </div>
                                            <input type="password" name="password" className="form-control" required onChange={e=>setPassword(e.target.value)} />
                                        </div>
                                    </div>
                                    <div className="form-group">
                                        <button type="submit" className="btn btn-default btn-login btn-block">Login</button>
                                    </div>
                                </form>
                            </div>
                            <p><small>Copyright Kab Bojonegoro &copy; 2022</small></p>
                        </div>

                    </div>
                </div>
            </div>
        </section>


    )

}
export default (Login)