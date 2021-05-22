package com.krokodillLl.degree.service;

public interface ActiveUserChangeListener {

    /**
     * call when Observable's internal state is changed.
     */
    void notifyActiveUserChange();
}
