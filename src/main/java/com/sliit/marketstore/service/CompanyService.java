package com.sliit.marketstore.service;
import com.sliit.marketstore.entity.Company;
import java.util.List;
public interface CompanyService {
    List<Company> getAll();
    Company getById(Integer id);
    Company save(Company company);
    Company update(Integer id, Company company);
    void delete(Integer id);
}
