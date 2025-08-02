// import * as XLSX from 'xlsx';

// export const handleFileUpload = async (file, userId, compliant_type, navigate) => {
//     try {
//         const fileType = file.name.split('.').pop().toLowerCase();
//         let data;

//         if (fileType === 'xlsx' || fileType === 'xls') {
//             // Handle Excel file
//             const reader = new FileReader();
//             reader.onload = async (e) => {
//                 const workbook = XLSX.read(e.target.result, { type: 'array' });
//                 const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
//                 data = XLSX.utils.sheet_to_json(firstSheet, { raw: true, defval: '' });
//             };
//             reader.readAsArrayBuffer(file);
//         } else if (fileType === 'pdf') {
//             // Handle PDF file
//             const reader = new FileReader();
//             reader.onload = async (e) => {
//                 data = e.target.result;
//             };
//             reader.readAsDataURL(file);
//         } else {
//             throw new Error('Unsupported file type');
//         }

//         const response = await axios.post('/upload-control-files', {
//             fileType: fileType === 'pdf' ? 'pdf' : 'excel',
//             data,
//             userId,
//             compliant_type
//         });

//         if (response.status === 200) {
//             setControlData([{
//                 controls: response.data.data,
//                 compliant_type: compliant_type,
//             }]);
//             navigate(`/home/${compliant_type}`);
//         }
//     } catch (err) {
//         alert(err.message || 'Failed to upload file');
//     }
// }; 