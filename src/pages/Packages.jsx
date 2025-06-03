import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import axios from "axios";
import {
  API_URL,
  BASE_URL_UPLOADS,
  PACKAGE_STATUS,
  PAYMENT_METHODS,
} from "../config";
import { format } from "date-fns";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { toast } from "react-hot-toast";
import { QRCodeSVG } from "qrcode.react";
import { Html5QrcodeScanner, Html5QrcodeSupportedFormats, Html5QrcodeScanType } from "html5-qrcode";
import {
  FaPlus,
  FaSearch,
  FaFilter,
  FaSpinner,
  FaCheckCircle,
  FaTimesCircle,
  FaBarcode,
  FaCamera,
  FaQrcode,
} from "react-icons/fa";

// Add global styles for the scanner
const scannerStyles = `

  #reader__scan_region {
    display: flex !important;
    justify-content: center !important;
    align-items: center !important;
  }
  
`;

const Packages = () => {
  const { user } = useAuth();
  const [packages, setPackages] = useState([]);
  const [locations, setLocations] = useState([]);
  const [recipients, setRecipients] = useState([]);
  const [carriers] = useState([
    "JNE",
    "J&T",
    "SiCepat",
    "Pos Indonesia",
    "AnterAja",
    "Ninja Express",
    "Other",
  ]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showPickupModal, setShowPickupModal] = useState(false);
  const [currentPackage, setCurrentPackage] = useState(null);
  const [showScanner, setShowScanner] = useState(false);
  const [scanner, setScanner] = useState(null);

  // Pagination state
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [locationFilter, setLocationFilter] = useState("");
  const [dateRangeFilter, setDateRangeFilter] = useState([null, null]);

  // New package form
  const [newPackage, setNewPackage] = useState({
    trackingNumber: "",
    recipientId: "",
    newRecipient: false,
    recipientName: "",
    recipientPhone: "",
    recipientUnit: "",
    senderName: "",
    carrierName: "",
    packageDescription: "",
    locationId: "",
    packageImage: null,
  });

  // Pickup form
  const [pickupForm, setPickupForm] = useState({
    paymentMethod: "cash",
    notes: "",
  });

  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await axios.get(`${API_URL}/locations`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setLocations(response.data);

        // If staff, set their location as the filter and disable changing it
        if (user?.role === "staff" && user?.locationId) {
          setLocationFilter(user.locationId);

          // For new package form
          setNewPackage((prev) => ({
            ...prev,
            locationId: user.locationId,
          }));
        }
      } catch (error) {
        console.error("Error fetching locations:", error);
        toast.error("Failed to load locations");
      }
    };

    const fetchRecipients = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await axios.get(`${API_URL}/recipients`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        console.log(response.data);

        // Ensure we're setting an array, even if empty
        setRecipients(
          Array.isArray(response.data.recipients)
            ? response.data.recipients
            : []
        );
      } catch (error) {
        console.error("Error fetching recipients:", error);
        toast.error("Failed to load recipients");
        // Initialize as empty array on error
        setRecipients([]);
      }
    };

    if (user) {
      fetchLocations();
      console.log(user);

      fetchRecipients();
    }
  }, [user]);

  useEffect(() => {
    const fetchPackages = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("token");

        // Build query params
        const params = {
          page,
          limit,
          search: searchTerm || undefined,
          status: statusFilter || undefined,
          locationId: locationFilter || undefined,
        };

        if (dateRangeFilter[0] && dateRangeFilter[1]) {
          params.startDate = format(dateRangeFilter[0], "yyyy-MM-dd");
          params.endDate = format(dateRangeFilter[1], "yyyy-MM-dd");
        }

        const response = await axios.get(`${API_URL}/packages`, {
          headers: { Authorization: `Bearer ${token}` },
          params,
        });

        setPackages(response.data.packages);
        setTotalPages(response.data.totalPages);
      } catch (error) {
        console.error("Error fetching packages:", error);
        toast.error("Failed to load packages");
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchPackages();
    }
  }, [
    user,
    page,
    limit,
    searchTerm,
    statusFilter,
    locationFilter,
    dateRangeFilter,
  ]);

  useEffect(() => {
    if (showScanner) {
      const html5QrcodeScanner = new Html5QrcodeScanner(
        "reader",
        { 
          fps: 10,
          qrbox: { width: 300, height: 300 },
          aspectRatio: 1.0,
          showTorchButtonIfSupported: true,
          showZoomSliderIfSupported: true,
          defaultZoomValueIfSupported: 1,
          formatsToSupport: [
            Html5QrcodeSupportedFormats.QR_CODE,
            Html5QrcodeSupportedFormats.CODE_128,
            Html5QrcodeSupportedFormats.CODE_39,
            Html5QrcodeSupportedFormats.EAN_13,
            Html5QrcodeSupportedFormats.EAN_8,
            Html5QrcodeSupportedFormats.UPC_A,
            Html5QrcodeSupportedFormats.UPC_E
          ],
          rememberLastUsedCamera: true,
          supportedScanTypes: [Html5QrcodeScanType.SCAN_TYPE_CAMERA],
          videoConstraints: {
            facingMode: { ideal: "environment" },
            width: { min: 640, ideal: 1280, max: 1920 },
            height: { min: 480, ideal: 720, max: 1080 }
          }
        },
        false
      );
      
      html5QrcodeScanner.render(onScanSuccess, onScanFailure);
      setScanner(html5QrcodeScanner);

      return () => {
        if (scanner) {
          scanner.clear();
        }
      };
    }
  }, [showScanner]);

  const onScanSuccess = (decodedText) => {
    // Stop the scanner first
    if (scanner) {
      scanner.clear();
      setScanner(null);
      setShowScanner(false);
    }
    
    // Set the scanned text as search term
    setSearchTerm(decodedText);
    toast.success("Barcode scanned successfully!");
  };

  const onScanFailure = (error) => {
    // Handle scan failure silently
    console.warn(`QR code scan error: ${error}`);
  };

  const toggleScanner = () => {
    setShowScanner(!showScanner);
    if (scanner) {
      scanner.clear();
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewPackage((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleRecipientTypeChange = (e) => {
    const isNewRecipient = e.target.value === "new";
    setNewPackage((prev) => ({
      ...prev,
      newRecipient: isNewRecipient,
      recipientId: isNewRecipient ? "" : prev.recipientId,
    }));
  };

  const resetForm = () => {
    setNewPackage({
      trackingNumber: "",
      recipientId: "",
      newRecipient: false,
      recipientName: "",
      recipientPhone: "",
      recipientUnit: "",
      senderName: "",
      carrierName: "",
      packageDescription: "",
      locationId: user?.role === "staff" ? user.locationId : "",
      packageImage: null,
    });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith("image/")) {
        toast.error("Please upload an image file");
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Image size should be less than 5MB");
        return;
      }

      setNewPackage((prev) => ({
        ...prev,
        packageImage: file,
      }));
    }
  };

  const handleCreatePackage = async () => {
    try {
      // Validation
      if (!newPackage.trackingNumber) {
        toast.error("Please enter a tracking number");
        return;
      }

      if (newPackage.newRecipient) {
        if (!newPackage.recipientName || !newPackage.recipientPhone) {
          toast.error("Please enter recipient name and phone number");
          return;
        }
      } else if (!newPackage.recipientId) {
        toast.error("Please select a recipient");
        return;
      }

      if (!newPackage.senderName) {
        toast.error("Please enter sender name");
        return;
      }

      if (!newPackage.carrierName) {
        toast.error("Please select a carrier");
        return;
      }

      if (!newPackage.locationId) {
        toast.error("Please select a location");
        return;
      }

      const token = localStorage.getItem("token");

      // Create FormData for file upload
      const formData = new FormData();
      Object.keys(newPackage).forEach((key) => {
        if (key === "packageImage" && newPackage[key]) {
          formData.append("packageImage", newPackage[key]);
        } else if (key === "newRecipient") {
          formData.append(key, newPackage[key].toString());
        } else {
          formData.append(key, newPackage[key]);
        }
      });

      await axios.post(`${API_URL}/packages`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      toast.success("Package created successfully");
      setShowAddModal(false);
      resetForm();

      // Refresh packages list
      const response = await axios.get(`${API_URL}/packages`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { page, limit },
      });

      setPackages(response.data.packages);
      setTotalPages(response.data.totalPages);
    } catch (error) {
      console.error("Error creating package:", error);
      toast.error(error.response?.data?.message || "Failed to create package");
    }
  };

  const handleViewPackage = (pkg) => {
    setCurrentPackage(pkg);
    setShowViewModal(true);
  };

  const handleInitiatePickup = (pkg) => {
    // Calculate days stored
    const receivedDate = new Date(pkg.receivedAt);
    const currentDate = new Date();
    const diffTime = Math.abs(currentDate - receivedDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const finalPrice = pkg.price * diffDays;

    setCurrentPackage({
      ...pkg,
      daysStored: diffDays,
      finalPrice: finalPrice,
    });
    setPickupForm({
      paymentMethod: "cash",
      notes: "",
    });
    setShowPickupModal(true);
  };

  const handlePickupPackage = async () => {
    try {
      const token = localStorage.getItem("token");
      await axios.put(
        `${API_URL}/packages/${currentPackage.id}/pickup`,
        pickupForm,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      toast.success("Package marked as picked up");
      setShowPickupModal(false);

      // Refresh packages list
      const response = await axios.get(`${API_URL}/packages`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { page, limit },
      });

      setPackages(response.data.packages);
    } catch (error) {
      console.error("Error processing pickup:", error);
      toast.error(error.response?.data?.message || "Failed to process pickup");
    }
  };

  const handleResendNotification = async (packageId) => {
    try {
      const token = localStorage.getItem("token");
      await axios.post(
        `${API_URL}/packages/${packageId}/notify`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      toast.success("Notification resent successfully");
    } catch (error) {
      console.error("Error resending notification:", error);
      toast.error("Failed to resend notification");
    }
  };

  useEffect(() => {
    // Add styles to document
    const styleElement = document.createElement('style');
    styleElement.textContent = scannerStyles;
    document.head.appendChild(styleElement);

    return () => {
      // Cleanup styles when component unmounts
      document.head.removeChild(styleElement);
    };
  }, []);

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            Package Management
          </h1>
          <p className="text-gray-600">
            Manage all incoming and outgoing packages
          </p>
        </div>
        <button
          className="btn-primary mt-3 sm:mt-0"
          onClick={() => setShowAddModal(true)}
        >
          <FaPlus className="mr-2" />
          Add New Package
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Search with Barcode Scanner */}
          <div>
            <label className="form-label">Search</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaSearch className="text-gray-400" />
              </div>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Tracking #, Recipient, Phone..."
                className="input pl-8"
              />
            </div>
          </div>

          {/* Status filter */}
          <div>
            <label className="form-label">Status</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaFilter className="text-gray-400" />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="input pl-8"
              >
                <option value="">All Statuses</option>
                <option value={PACKAGE_STATUS.STORED}>Stored</option>
                <option value={PACKAGE_STATUS.PICKED_UP}>Picked Up</option>
                <option value={PACKAGE_STATUS.DESTROYED}>Destroyed</option>
              </select>
            </div>
          </div>

          {/* Location filter (admin only) */}
          {user?.role === "admin" && (
            <div>
              <label className="form-label">Location</label>
              <select
                value={locationFilter}
                onChange={(e) => setLocationFilter(e.target.value)}
                className="input"
              >
                <option value="">All Locations</option>
                {locations.map((location) => (
                  <option key={location.id} value={location.id}>
                    {location.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Date range filter */}
          <div>
            <label className="form-label">Received Date</label>
            <DatePicker
              selectsRange={true}
              startDate={dateRangeFilter[0]}
              endDate={dateRangeFilter[1]}
              onChange={(update) => {
                setDateRangeFilter(update);
              }}
              placeholderText="Select date range"
              className="input"
            />
          </div>
        </div>
      </div>

      <div onClick={toggleScanner} className=" cursor-pointer flex items-center p-2 justify-between bg-white rounded-lg shadow-sm mb-6 max-w-32">
        <label>Scan</label>
        <div
          className="flex items-center text-gray-400 hover:text-gray-600"
          title="Scan Barcode"
        >
          <FaBarcode />
        </div>
      </div>

      {/* Packages Table */}
      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>Tracking #</th>
              <th>QR Code</th>
              <th>Recipient</th>
              <th>Phone</th>
              <th>Received Time</th>
              <th>Pickup Time</th>
              <th>Sender</th>
              <th>Location</th>
              <th>Status</th>
              <th>Price</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="11" className="text-center py-4">
                  <FaSpinner className="animate-spin mx-auto text-primary-500 text-xl" />
                </td>
              </tr>
            ) : packages.length === 0 ? (
              <tr>
                <td colSpan="11" className="text-center py-4 text-gray-500">
                  No packages found
                </td>
              </tr>
            ) : (
              packages.map((pkg) => (
                <tr key={pkg.id}>
                  <td>{pkg.trackingNumber}</td>
                  <td>
                    {pkg.qrCodeUrl ? (
                      <img
                        src={`${BASE_URL_UPLOADS}${pkg.qrCodeUrl}`}
                        alt="QR Code"
                        className="w-12 h-12 object-contain"
                      />
                    ) : (
                      <div className="w-12 h-12 bg-gray-100 flex items-center justify-center">
                        <FaQrcode className="text-gray-400" />
                      </div>
                    )}
                  </td>
                  <td>{pkg.recipient.name}</td>
                  <td>{pkg.recipient.phone}</td>
                  <td>
                    {format(new Date(pkg.receivedAt), "yyyy-MM-dd HH:mm")}
                  </td>
                  <td>
                    {pkg.pickedUpAt
                      ? format(new Date(pkg.pickedUpAt), "yyyy-MM-dd HH:mm")
                      : "-"}
                  </td>
                  <td>{pkg.sender.name}</td>
                  <td>{pkg.location.name}</td>
                  <td>
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        pkg.status === PACKAGE_STATUS.STORED
                          ? "bg-blue-100 text-blue-800"
                          : pkg.status === PACKAGE_STATUS.PICKED_UP
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {pkg.status === PACKAGE_STATUS.STORED
                        ? "Stored"
                        : pkg.status === PACKAGE_STATUS.PICKED_UP
                        ? "Picked Up"
                        : "Destroyed"}
                    </span>
                  </td>
                  <td>Rp {pkg.price.toLocaleString()}</td>
                  <td>
                    <div className="flex space-x-2">
                      <button
                        className="p-1.5 text-gray-600 hover:text-primary-600 rounded-full hover:bg-gray-100"
                        onClick={() => handleViewPackage(pkg)}
                        title="View Details"
                      >
                        <FaSearch size={14} />
                      </button>

                      {pkg.status === PACKAGE_STATUS.STORED && (
                        <button
                          className="p-1.5 text-gray-600 hover:text-green-600 rounded-full hover:bg-gray-100"
                          onClick={() => handleInitiatePickup(pkg)}
                          title="Process Pickup"
                        >
                          <FaCheckCircle size={14} />
                        </button>
                      )}

                      {pkg.status === PACKAGE_STATUS.STORED && (
                        <button
                          className="p-1.5 text-gray-600 hover:text-accent-600 rounded-full hover:bg-gray-100"
                          onClick={() => handleResendNotification(pkg.id)}
                          title="Resend Notification"
                        >
                          <FaBarcode size={14} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="mt-4 flex justify-between items-center">
        <div>
          <select
            value={limit}
            onChange={(e) => {
              setLimit(Number(e.target.value));
              setPage(1);
            }}
            className="border rounded px-2 py-1 text-sm"
          >
            <option value="10">10 per page</option>
            <option value="20">20 per page</option>
            <option value="50">50 per page</option>
            <option value="100">100 per page</option>
          </select>
        </div>

        <div className="flex space-x-2">
          <button
            className="btn-outline px-3 py-1"
            disabled={page === 1}
            onClick={() => setPage(page - 1)}
          >
            Previous
          </button>
          <span className="px-4 py-1 border rounded bg-gray-50">
            Page {page} of {totalPages || 1}
          </span>
          <button
            className="btn-outline px-3 py-1"
            disabled={page === totalPages || totalPages === 0}
            onClick={() => setPage(page + 1)}
          >
            Next
          </button>
        </div>
      </div>

      {/* Add Package Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div
              className="fixed inset-0 transition-opacity"
              aria-hidden="true"
            >
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">
                    Add New Package
                  </h3>
                  <button
                    className="text-gray-400 hover:text-gray-500"
                    onClick={() => setShowAddModal(false)}
                  >
                    <FaTimesCircle />
                  </button>
                </div>

                <div className="mt-2 space-y-4">
                  {/* Tracking Number without QR Code */}
                  <div className="form-group">
                    <label className="form-label" htmlFor="trackingNumber">
                      Tracking Number *
                    </label>
                    <input
                      type="text"
                      id="trackingNumber"
                      name="trackingNumber"
                      value={newPackage.trackingNumber}
                      onChange={handleInputChange}
                      className="input"
                    />
                  </div>

                  {/* Package Image */}
                  <div className="form-group">
                    <label className="form-label" htmlFor="packageImage">
                      Package Image
                    </label>
                    <div className="mt-1 flex items-center space-x-4">
                      <label className="flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 cursor-pointer">
                        <FaCamera className="mr-2" />
                        Upload Image
                        <input
                          type="file"
                          id="packageImage"
                          name="packageImage"
                          accept="image/*"
                          onChange={handleImageChange}
                          className="hidden"
                        />
                      </label>
                      {newPackage.packageImage && (
                        <div className="flex-shrink-0">
                          <img
                            src={URL.createObjectURL(newPackage.packageImage)}
                            alt="Package preview"
                            className="h-20 w-20 object-cover rounded-md"
                          />
                        </div>
                      )}
                    </div>
                    <p className="mt-1 text-sm text-gray-500">
                      Upload a photo of the package (max 5MB)
                    </p>
                  </div>

                  {/* Recipient Type */}
                  <div className="form-group">
                    <label className="form-label">Recipient *</label>
                    <div className="flex items-center space-x-4">
                      <label className="inline-flex items-center">
                        <input
                          type="radio"
                          name="recipientType"
                          value="existing"
                          checked={!newPackage.newRecipient}
                          onChange={handleRecipientTypeChange}
                          className="mr-2"
                        />
                        Existing Recipient
                      </label>
                      <label className="inline-flex items-center">
                        <input
                          type="radio"
                          name="recipientType"
                          value="new"
                          checked={newPackage.newRecipient}
                          onChange={handleRecipientTypeChange}
                          className="mr-2"
                        />
                        New Recipient
                      </label>
                    </div>
                  </div>

                  {/* Existing Recipient */}
                  {!newPackage.newRecipient && (
                    <div className="form-group">
                      <label className="form-label" htmlFor="recipientId">
                        Select Recipient *
                      </label>
                      <select
                        id="recipientId"
                        name="recipientId"
                        value={newPackage.recipientId}
                        onChange={handleInputChange}
                        className="input"
                      >
                        <option value="">Select a recipient</option>
                        {recipients?.map((recipient) => (
                          <option key={recipient.id} value={recipient.id}>
                            {recipient.name} ({recipient.unit}) -{" "}
                            {recipient.phone}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* New Recipient */}
                  {newPackage.newRecipient && (
                    <>
                      <div className="form-group">
                        <label className="form-label" htmlFor="recipientName">
                          Recipient Name *
                        </label>
                        <input
                          type="text"
                          id="recipientName"
                          name="recipientName"
                          value={newPackage.recipientName}
                          onChange={handleInputChange}
                          className="input"
                        />
                      </div>

                      <div className="form-group">
                        <label className="form-label" htmlFor="recipientPhone">
                          Recipient Phone *
                        </label>
                        <input
                          type="text"
                          id="recipientPhone"
                          name="recipientPhone"
                          value={newPackage.recipientPhone}
                          onChange={handleInputChange}
                          className="input"
                        />
                      </div>

                      <div className="form-group">
                        <label className="form-label" htmlFor="recipientUnit">
                          Apartment Unit
                        </label>
                        <input
                          type="text"
                          id="recipientUnit"
                          name="recipientUnit"
                          value={newPackage.recipientUnit}
                          onChange={handleInputChange}
                          className="input"
                        />
                      </div>
                    </>
                  )}

                  {/* Sender Information */}
                  <div className="form-group">
                    <label className="form-label" htmlFor="senderName">
                      Sender Name *
                    </label>
                    <input
                      type="text"
                      id="senderName"
                      name="senderName"
                      value={newPackage.senderName}
                      onChange={handleInputChange}
                      className="input"
                    />
                  </div>

                  {/* Carrier */}
                  <div className="form-group">
                    <label className="form-label" htmlFor="carrierName">
                      Carrier/Expedition *
                    </label>
                    <select
                      id="carrierName"
                      name="carrierName"
                      value={newPackage.carrierName}
                      onChange={handleInputChange}
                      className="input"
                    >
                      <option value="">Select a carrier</option>
                      {carriers.map((carrier) => (
                        <option key={carrier} value={carrier}>
                          {carrier}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Package Description */}
                  <div className="form-group">
                    <label className="form-label" htmlFor="packageDescription">
                      Package Description
                    </label>
                    <textarea
                      id="packageDescription"
                      name="packageDescription"
                      value={newPackage.packageDescription}
                      onChange={handleInputChange}
                      className="input"
                      rows="2"
                    />
                  </div>

                  {/* Location (for admin) */}
                  {user?.role === "admin" && (
                    <div className="form-group">
                      <label className="form-label" htmlFor="locationId">
                        Location *
                      </label>
                      <select
                        id="locationId"
                        name="locationId"
                        value={newPackage.locationId}
                        onChange={handleInputChange}
                        className="input"
                      >
                        <option value="">Select a location</option>
                        {locations.map((location) => (
                          <option key={location.id} value={location.id}>
                            {location.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  className="btn-primary sm:ml-2"
                  onClick={handleCreatePackage}
                >
                  Add Package
                </button>
                <button
                  type="button"
                  className="btn-outline"
                  onClick={() => setShowAddModal(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* View Package Modal */}
      {showViewModal && currentPackage && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div
              className="fixed inset-0 transition-opacity"
              aria-hidden="true"
            >
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">
                    Package Details
                  </h3>
                  <button
                    className="text-gray-400 hover:text-gray-500"
                    onClick={() => setShowViewModal(false)}
                  >
                    <FaTimesCircle />
                  </button>
                </div>

                <div className="bg-gray-50 p-4 rounded-md mb-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-gray-500">
                      Tracking Number
                    </span>
                    <div className="flex items-center space-x-2">
                      <span className="font-medium">
                        {currentPackage.trackingNumber}
                      </span>
                      <QRCodeSVG
                        value={currentPackage.trackingNumber}
                        size={32}
                        level="H"
                        includeMargin={true}
                      />
                    </div>
                  </div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-gray-500">Status</span>
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        currentPackage.status === PACKAGE_STATUS.STORED
                          ? "bg-blue-100 text-blue-800"
                          : currentPackage.status === PACKAGE_STATUS.PICKED_UP
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {currentPackage.status === PACKAGE_STATUS.STORED
                        ? "Stored"
                        : currentPackage.status === PACKAGE_STATUS.PICKED_UP
                        ? "Picked Up"
                        : "Destroyed"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-gray-500">Pickup Code</span>
                    <span className="font-medium">
                      {currentPackage.pickupCode}
                    </span>
                  </div>
                </div>

                {/* Package Image */}
                {currentPackage.packageImage && (
                  <div className="mb-4">
                    <h4 className="font-medium mb-2">Package Image</h4>
                    <div className="relative w-full h-48 w-full md:w-48">
                      <img
                        src={`${BASE_URL_UPLOADS}${currentPackage.packageImage}`}
                        alt="Package"
                        className="w-full h-full object-cover rounded-lg"
                      />
                    </div>
                  </div>
                )}

                <div className="mb-4">
                  <h4 className="font-medium mb-2">Recipient Information</h4>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <p className="text-sm text-gray-500">Name</p>
                      <p>{currentPackage.recipient.name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Phone</p>
                      <p>{currentPackage.recipient.phone}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Unit</p>
                      <p>{currentPackage.recipient.unit || "-"}</p>
                    </div>
                  </div>
                </div>

                <div className="mb-4">
                  <h4 className="font-medium mb-2">Package Information</h4>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <p className="text-sm text-gray-500">Sender</p>
                      <p>{currentPackage.sender.name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Carrier</p>
                      <p>{currentPackage.carrier.name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Location</p>
                      <p>{currentPackage.location.name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Price</p>
                      <p>Rp {currentPackage.price.toLocaleString()}</p>
                    </div>
                  </div>
                </div>

                <div className="mb-4">
                  <h4 className="font-medium mb-2">Receipt Information</h4>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <p className="text-sm text-gray-500">Received By</p>
                      <p>{currentPackage.receivedBy.fullName}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Received At</p>
                      <p>
                        {format(
                          new Date(currentPackage.receivedAt),
                          "yyyy-MM-dd HH:mm"
                        )}
                      </p>
                    </div>
                  </div>
                </div>

                {currentPackage.status === PACKAGE_STATUS.PICKED_UP && (
                  <div className="mb-4">
                    <h4 className="font-medium mb-2">Pickup Information</h4>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <p className="text-sm text-gray-500">
                          Picked Up By Staff
                        </p>
                        <p>{currentPackage.pickedUpBy.fullName}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Picked Up At</p>
                        <p>
                          {format(
                            new Date(currentPackage.pickedUpAt),
                            "yyyy-MM-dd HH:mm"
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                {currentPackage.status === PACKAGE_STATUS.STORED && (
                  <button
                    type="button"
                    className="btn-primary sm:ml-2"
                    onClick={() => {
                      setShowViewModal(false);
                      handleInitiatePickup(currentPackage);
                    }}
                  >
                    Process Pickup
                  </button>
                )}
                <button
                  type="button"
                  className="btn-outline"
                  onClick={() => setShowViewModal(false)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Pickup Modal */}
      {showPickupModal && currentPackage && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div
              className="fixed inset-0 transition-opacity"
              aria-hidden="true"
            >
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">
                    Process Package Pickup
                  </h3>
                  <button
                    className="text-gray-400 hover:text-gray-500"
                    onClick={() => setShowPickupModal(false)}
                  >
                    <FaTimesCircle />
                  </button>
                </div>

                <div className="bg-gray-50 p-4 rounded-md mb-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-gray-500">
                      Tracking Number
                    </span>
                    <span className="font-medium">
                      {currentPackage.trackingNumber}
                    </span>
                  </div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-gray-500">Recipient</span>
                    <span className="font-medium">
                      {currentPackage.recipient.name}
                    </span>
                  </div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-gray-500">Base Price</span>
                    <span className="font-medium">
                      Rp{" "}
                      {Number(currentPackage.price).toLocaleString("id-ID", {
                        maximumFractionDigits: 0,
                      })}
                    </span>
                  </div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-gray-500">Days Stored</span>
                    <span className="font-medium">
                      {currentPackage.daysStored} day
                      {currentPackage.daysStored > 1 ? "s" : ""}
                    </span>
                  </div>
                  <div className="flex justify-between items-center border-t pt-2 mt-2">
                    <span className="text-sm font-medium text-gray-700">
                      Final Price
                    </span>
                    <span className="font-medium text-lg text-primary-600">
                      Rp{" "}
                      {Number(currentPackage.finalPrice).toLocaleString(
                        "id-ID",
                        { maximumFractionDigits: 0 }
                      )}
                    </span>
                  </div>
                </div>

                <div className="mt-4 space-y-4">
                  <div className="form-group">
                    <label className="form-label" htmlFor="paymentMethod">
                      Payment Method *
                    </label>
                    <select
                      id="paymentMethod"
                      value={pickupForm.paymentMethod}
                      onChange={(e) =>
                        setPickupForm({
                          ...pickupForm,
                          paymentMethod: e.target.value,
                        })
                      }
                      className="input"
                    >
                      {PAYMENT_METHODS.map((method) => (
                        <option key={method.value} value={method.value}>
                          {method.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="notes">
                      Notes
                    </label>
                    <textarea
                      id="notes"
                      value={pickupForm.notes}
                      onChange={(e) =>
                        setPickupForm({ ...pickupForm, notes: e.target.value })
                      }
                      className="input"
                      rows="2"
                      placeholder="Optional notes about the pickup"
                    />
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  className="btn-primary sm:ml-2"
                  onClick={handlePickupPackage}
                >
                  Confirm Pickup
                </button>
                <button
                  type="button"
                  className="btn-outline"
                  onClick={() => setShowPickupModal(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Barcode Scanner Modal */}
      {showScanner && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div
              className="fixed inset-0 transition-opacity"
              aria-hidden="true"
            >
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">
                    Scan Barcode/QR Code
                  </h3>
                  <button
                    className="text-gray-400 hover:text-gray-500"
                    onClick={toggleScanner}
                  >
                    <FaTimesCircle />
                  </button>
                </div>
                <div className="flex flex-col items-center justify-center">
                  <div id="reader" className="w-full max-w-md mx-auto"></div>
                  <p className="mt-4 text-sm text-gray-500 text-center">
                    Position the barcode/QR code within the frame
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Packages;
