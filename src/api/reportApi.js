import axios from 'axios';

const api = axios.create({
  baseURL: '/api/reports',
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('token')}` // JWT 토큰 처리
  }
});

export const reportApi = {
  // 나의 내역 목록 조회
  getMyReports: () => api.get('/my'),
  
  // 상세 조회
  getDetail: (id) => api.get(`/my/${id}`),
  
  // 건의사항 등록
  create: (data) => api.post('', data),
  
  // 건의사항 수정
  update: (id, data) => api.put(`/my/${id}`, data),
  
  // 건의사항 삭제
  delete: (id) => api.delete(`/my/${id}`)
};