import { fetchUtils } from 'react-admin';
import axios from 'axios';


const httpClient = (url, options = {}) => {
    if (!options.headers) {
        options.headers = new Headers({ Accept: 'application/json' });
    }
    console.log('[httpClient] Requesting URL:', url); // <--- TAMBAHKAN INI
    console.log('[httpClient] With options:', options); // <--- DAN INI
    return fetchUtils.fetchJson(url, options);
};

const API_URL = 'https://web-production-06f9.up.railway.app/api';

const flexibleHttpClient = async (url, options = {}) => {
    const token = localStorage.getItem('token');
    const headers = options.headers instanceof Headers ? options.headers : new Headers(options.headers);
    if (token) headers.set('Authorization', `Bearer ${token}`);

    if (!(options.body instanceof FormData)) {
        if (!headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
        if (!headers.has('Accept')) headers.set('Accept', 'application/json');
        if (options.body && typeof options.body !== 'string') options.body = JSON.stringify(options.body);
    } else {
        if (!headers.has('Accept')) headers.set('Accept', 'application/json');
        headers.delete('Content-Type');
    }
    options.headers = headers;

    console.log('[flexibleHttpClient] Requesting URL:', url);
    console.log('[flexibleHttpClient] With options:', JSON.parse(JSON.stringify(options))); // Log options (hati-hati jika body besar)
    if (options.body instanceof FormData) {
        console.log('[flexibleHttpClient] Body is FormData. Entries:');
        for (let pair of options.body.entries()) {
            console.log(pair[0]+ ', ' + (pair[1] instanceof File ? `File: ${pair[1].name} (size: ${pair[1].size}, type: ${pair[1].type})` : pair[1]));
        }
    } else {
        console.log('[flexibleHttpClient] Body (stringified):', options.body);
    }
    return fetchUtils.fetchJson(url, options);
    
};

const dataProvider = {
    getList: (resource, params) => {
    const url = `${API_URL}/${resource}/`; 
    console.log(`[dataProvider.getList] Requesting: ${url}`); 

    return httpClient(url).then(({ headers, json }) => { 
        console.log(`[dataProvider.getList] Raw JSON response for ${resource}:`, JSON.parse(JSON.stringify(json)));

        
        if (Array.isArray(json) && json.length > 0) {
            console.log(`[dataProvider.getList] First item's image:`, json[0].image);
            console.log(`[dataProvider.getList] Type of first item's image:`, typeof json[0].image);
        }

       
        let totalCount = json.length; 
        if (headers && headers.has('x-total-count')) {
            totalCount = parseInt(headers.get('x-total-count'), 10);
        } else if (Array.isArray(json)) {
             console.warn(`[dataProvider.getList] X-Total-Count header missing for ${resource}. Using array length as total.`);
        }

        if (resource === 'quizzes' && Array.isArray(json) && json.length > 0 && json[0].questions && json[0].questions.length > 0) {
        console.log(`[dataProvider.getList] First quiz, first question image:`, json[0].questions[0].image);
        console.log(`[dataProvider.getList] Type of first quiz, first question image:`, typeof json[0].questions[0].image);
}


        return {
            data: json,
            total: totalCount,
        };
    });
    },

    getOne: (resource, params) => {
        const url = `${API_URL}/${resource}/${params.id}/`;
        return httpClient(url).then(({ json }) => ({
            data: json,
        }));
    },

      create: (resource, params) => {
        const url = `${API_URL}/${resource}/`;
        console.log(`[CREATE ${resource}] URL: ${url}`);
        console.log(`[CREATE ${resource}] Original params.data:`, JSON.parse(JSON.stringify(params.data)));

        let isSendingFormData = false;
        const formData = new FormData();

        if (resource === 'artikels' && params.data.image && params.data.image.rawFile instanceof File) {
            isSendingFormData = true;
            formData.append('image', params.data.image.rawFile, params.data.image.rawFile.name);
        } else if (resource === 'quizzes' && params.data.questions) {
            params.data.questions.forEach((question, index) => {
                if (question.image && question.image.rawFile instanceof File) {
                    isSendingFormData = true;
                    
                    formData.append(`questions[${index}][image]`, question.image.rawFile, question.image.rawFile.name);
                }
            });
        }

        if (isSendingFormData) {
            console.log(`[CREATE ${resource}] New image file(s) detected. Sending FormData.`);
            
            for (const key in params.data) {
                if (params.data[key] == null || key === 'id') continue;

                if (key === 'image' && resource === 'artikels') { // Sudah ditangani
                    continue;
                } else if (key === 'questions' && resource === 'quizzes') {
                    
                    params.data.questions.forEach((question, index) => {
                        formData.append(`questions[${index}][text]`, question.text || '');
                      


                        if (question.choices && Array.isArray(question.choices)) {
                            question.choices.forEach((choice, choiceIndex) => {
                                formData.append(`questions[${index}][choices][${choiceIndex}][text]`, choice.text || '');
                                formData.append(`questions[${index}][choices][${choiceIndex}][is_correct]`, choice.is_correct != null ? choice.is_correct : false);
                            });
                        }
                    });
                } else { 
                    formData.append(key, params.data[key]);
                }
            }
            return flexibleHttpClient(url, { method: 'POST', body: formData })
                   .then(({ json }) => ({ data: json }));
        } else {
            
            console.log(`[CREATE ${resource}] No new image files. Sending JSON.`);
            const dataToSend = JSON.parse(JSON.stringify(params.data)); 
            
            if (resource === 'quizzes' && dataToSend.questions) {
                dataToSend.questions = dataToSend.questions.map(q => {
                    const cleanQ = { ...q };
                    if (cleanQ.image && typeof cleanQ.image === 'object') delete cleanQ.image;
                    return cleanQ;
                });
            } else if (dataToSend.image && typeof dataToSend.image === 'object') {
                delete dataToSend.image;
            }
            return flexibleHttpClient(url, { method: 'POST', body: dataToSend })
                   .then(({ json }) => ({ data: { ...params.data, id: json.id, ...json } }));
        }
    },

   update: (resource, params) => {
        const url = `${API_URL}/${resource}/${params.id}/`;
        console.log(`[UPDATE ${resource}] URL: ${url}`);
        console.log(`[UPDATE ${resource}] Original params.data:`, JSON.parse(JSON.stringify(params.data)));

        let isSendingFormData = false;
        const formData = new FormData();

        
        if (resource === 'artikels' && params.data.image && params.data.image.rawFile instanceof File) {
            isSendingFormData = true;
            formData.append('image', params.data.image.rawFile, params.data.image.rawFile.name);
        } else if (resource === 'quizzes' && params.data.questions) {
            params.data.questions.forEach((question, index) => {
                if (question.image && question.image.rawFile instanceof File) {
                    isSendingFormData = true;
                    formData.append(`questions[${index}][image]`, question.image.rawFile, question.image.rawFile.name);
                }
            });
        }

        if (isSendingFormData) {
            console.log(`[UPDATE ${resource}] New image file(s) detected. Sending FormData.`);
            for (const key in params.data) {
                if (params.data[key] == null || key === 'id') continue;
                if (key === 'image' && resource === 'artikels') continue;
                else if (key === 'questions' && resource === 'quizzes') {
                    params.data.questions.forEach((question, index) => {
                        formData.append(`questions[${index}][text]`, question.text || '');
                        
                        if (!(question.image && question.image.rawFile instanceof File)) {
                            
                        }
                        if (question.choices && Array.isArray(question.choices)) {
                            question.choices.forEach((choice, choiceIndex) => {
                                formData.append(`questions[${index}][choices][${choiceIndex}][text]`, choice.text || '');
                                formData.append(`questions[${index}][choices][${choiceIndex}][is_correct]`, choice.is_correct != null ? choice.is_correct : false);
                            });
                        }
                    });
                } else {
                    formData.append(key, params.data[key]);
                }
            }
            return flexibleHttpClient(url, { method: 'PUT', body: formData })
                   .then(({ json }) => ({ data: json }));
        } else {
            
            console.log(`[UPDATE ${resource}] No new image files. Sending JSON.`);
            const dataToSend = JSON.parse(JSON.stringify(params.data)); // Deep clone
            if (resource === 'quizzes' && dataToSend.questions) {
                dataToSend.questions = dataToSend.questions.map(q => {
                    const cleanQ = { ...q };
                    delete cleanQ.id;
                    if (cleanQ.image && typeof cleanQ.image === 'object') {
                        
                        if (typeof cleanQ.image.src === 'string' && cleanQ.image.src.startsWith('/api/')) {
                          
                           cleanQ.image = null; 
                        } else {
                           delete cleanQ.image; 
                        }
                    }
                    return cleanQ;
                });
            } else if (resource === 'artikels' && dataToSend.image && typeof dataToSend.image === 'object') {
                
                dataToSend.image = null;
            }
            delete dataToSend.id;
            return flexibleHttpClient(url, { method: 'PUT', body: dataToSend })
                   .then(({ json }) => ({ data: json }));
        }
    },


    delete: (resource, params) => {
        const url = `${API_URL}/${resource}/${params.id}/`;
        return httpClient(url, {
            method: 'DELETE',
        }).then(({ json }) => ({
            data: json,
        }));
    },

    updateMany: () => Promise.resolve(),
    deleteMany: () => Promise.resolve(),
    getMany: () => Promise.resolve(),
    getManyReference: () => Promise.resolve(),
};

export default dataProvider;
