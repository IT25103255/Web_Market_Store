package com.sliit.marketstore.repository;

import com.sliit.marketstore.entity.Company;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CompanyRepository extends JpaRepository<Company, Integer> {}
